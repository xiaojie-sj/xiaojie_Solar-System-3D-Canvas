import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export type GestureType = 'none' | 'open_palm' | 'pinch' | 'fist' | 'victory' | 'pointing';

export interface GestureState {
  type: GestureType;
  label: string;
  confidence: number;
  pinchDistance: number; // 0 to 1
  palmCenter: { x: number; y: number; z: number };
  indexTip: { x: number; y: number; z: number };
  deltaX: number;
  deltaY: number;
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private isRunning: boolean = false;
  private animId: number = 0;
  private lastVideoTime: number = -1;

  // Previous position for velocity tracking
  private prevPalmPos: { x: number; y: number } | null = null;
  private lastGestureTime: number = 0;

  // Listeners
  private onGestureCallback?: (gesture: GestureState) => void;
  private onFrameCallback?: (result: HandLandmarkerResult, video: HTMLVideoElement) => void;
  private onErrorCallback?: (err: Error) => void;

  constructor() {}

  public async initialize(
    onGesture: (gesture: GestureState) => void,
    onFrame: (result: HandLandmarkerResult, video: HTMLVideoElement) => void,
    onError: (err: Error) => void
  ) {
    this.onGestureCallback = onGesture;
    this.onFrameCallback = onFrame;
    this.onErrorCallback = onError;

    try {
      // 1. Immediately request camera permission so the browser displays the permission dialog without delay
      const streamPromise = navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      // 2. Concurrently initialize vision wasm and hand landmarker model
      const modelPromise = (async () => {
        const vision = await FilesetResolver.forVisionTasks('/wasm');
        return await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      })();

      // Wait for camera stream permission
      const stream = await streamPromise;

      // 3. Setup video camera stream
      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', '');
      this.video.setAttribute('muted', '');
      this.video.muted = true;
      this.video.srcObject = stream;

      // Wait for model and video metadata in parallel
      const [landmarker] = await Promise.all([
        modelPromise,
        new Promise<void>((resolve) => {
          if (!this.video) return resolve();
          this.video.onloadedmetadata = () => {
            this.video?.play();
            resolve();
          };
        }),
      ]);

      this.handLandmarker = landmarker;

      this.isRunning = true;
      this.startDetectionLoop();
    } catch (err) {
      console.error('Failed to initialize HandTracker:', err);
      if (this.onErrorCallback) {
        this.onErrorCallback(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  private startDetectionLoop() {
    const loop = () => {
      if (!this.isRunning) return;

      if (this.video && this.handLandmarker && this.video.readyState >= 2) {
        if (this.video.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = this.video.currentTime;
          const startTimeMs = performance.now();
          const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);

          if (this.onFrameCallback) {
            this.onFrameCallback(results, this.video);
          }

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const gesture = this.classifyGesture(landmarks);
            if (this.onGestureCallback) {
              this.onGestureCallback(gesture);
            }
          } else {
            this.prevPalmPos = null;
            if (this.onGestureCallback) {
              this.onGestureCallback({
                type: 'none',
                label: '未检测到手势',
                confidence: 0,
                pinchDistance: 1,
                palmCenter: { x: 0.5, y: 0.5, z: 0 },
                indexTip: { x: 0.5, y: 0.5, z: 0 },
                deltaX: 0,
                deltaY: 0,
              });
            }
          }
        }
      }

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  /**
   * Classify user hand gesture from 21 MediaPipe 3D landmarks
   */
  private classifyGesture(lm: { x: number; y: number; z: number }[]): GestureState {
    // MediaPipe Hand Landmark IDs:
    // 0: Wrist
    // 4: Thumb Tip, 3: Thumb IP, 2: Thumb MCP
    // 8: Index Tip, 7: Index DIP, 6: Index PIP, 5: Index MCP
    // 12: Middle Tip, 11: Middle DIP, 10: Middle PIP, 9: Middle MCP
    // 16: Ring Tip, 15: Ring DIP, 14: Ring PIP, 13: Ring MCP
    // 20: Pinky Tip, 19: Pinky DIP, 18: Pinky PIP, 17: Pinky MCP

    // Palm center approximated by average of wrist (0), index MCP (5), pinky MCP (17)
    // Note: mirror X so moving hand right moves view right
    const palmX = 1.0 - (lm[0].x + lm[5].x + lm[17].x) / 3;
    const palmY = (lm[0].y + lm[5].y + lm[17].y) / 3;
    const palmZ = (lm[0].z + lm[5].z + lm[17].z) / 3;

    // Movement Delta
    let deltaX = 0;
    let deltaY = 0;
    if (this.prevPalmPos) {
      deltaX = palmX - this.prevPalmPos.x;
      deltaY = palmY - this.prevPalmPos.y;
    }
    this.prevPalmPos = { x: palmX, y: palmY };

    // Index Tip (mirrored X)
    const indexTip = { x: 1.0 - lm[8].x, y: lm[8].y, z: lm[8].z };

    // Pinch distance between Thumb Tip (#4) and Index Tip (#8)
    const dx = lm[4].x - lm[8].x;
    const dy = lm[4].y - lm[8].y;
    const dz = lm[4].z - lm[8].z;
    const pinchDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Extension check for each finger: tip is higher/further than PIP
    // For fingers pointing up: tip.y < pip.y
    const wrist = lm[0];
    function isFingerExtended(tipIdx: number, pipIdx: number) {
      const tipDist = Math.hypot(lm[tipIdx].x - wrist.x, lm[tipIdx].y - wrist.y);
      const pipDist = Math.hypot(lm[pipIdx].x - wrist.x, lm[pipIdx].y - wrist.y);
      return tipDist > pipDist * 1.15;
    }

    const indexExtended = isFingerExtended(8, 6);
    const middleExtended = isFingerExtended(12, 10);
    const ringExtended = isFingerExtended(16, 14);
    const pinkyExtended = isFingerExtended(20, 18);

    // Distance of all fingertips to palm center (for fist check)
    const avgTipToWrist = (
      Math.hypot(lm[8].x - lm[0].x, lm[8].y - lm[0].y) +
      Math.hypot(lm[12].x - lm[0].x, lm[12].y - lm[0].y) +
      Math.hypot(lm[16].x - lm[0].x, lm[16].y - lm[0].y) +
      Math.hypot(lm[20].x - lm[0].x, lm[20].y - lm[0].y)
    ) / 4;

    let type: GestureType = 'open_palm';
    let label = '🖐️ 掌心自由旋转';
    let confidence = 0.85;

    // 1. Clenched Fist: all fingers folded close
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && avgTipToWrist < 0.28) {
      type = 'fist';
      label = '✊ 握拳 · 时间冻结';
      confidence = 0.95;
    }
    // 2. Pinch Gesture: thumb and index very close (< 0.08)
    else if (pinchDist < 0.075) {
      type = 'pinch';
      label = '👌 捏合 · 空间缩放';
      confidence = 0.92;
    }
    // 3. Victory / Peace Sign: index & middle extended, ring & pinky folded
    else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      type = 'victory';
      label = '✌️ 胜利手势 · 天体跃迁';
      confidence = 0.90;
    }
    // 4. Pointing: only index extended
    else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      type = 'pointing';
      label = '☝️ 食指激光 · 目标锁定';
      confidence = 0.88;
    }
    // 5. Open Palm: all fingers extended
    else if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      type = 'open_palm';
      label = '🖐️ 掌心平移旋转';
      confidence = 0.88;
    }

    return {
      type,
      label,
      confidence,
      pinchDistance: Math.min(1.0, pinchDist * 5),
      palmCenter: { x: palmX, y: palmY, z: palmZ },
      indexTip,
      deltaX,
      deltaY,
    };
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);

    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }

    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }
}
