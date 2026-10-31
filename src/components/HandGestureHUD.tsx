import React, { useRef, useEffect, useState } from 'react';
import { HandTracker, GestureState } from '../services/HandTracker';
import { HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { 
  Hand, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  HelpCircle, 
  Sparkles,
  Zap
} from 'lucide-react';

// Hand landmark connections in MediaPipe (pairs of joint indices)
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm
  [5, 9], [9, 13], [13, 17]
];

interface HandGestureHUDProps {
  isActive: boolean;
  onToggleActive: () => void;
  onGesture: (gesture: GestureState) => void;
  gestureState: GestureState | null;
}

export const HandGestureHUD: React.FC<HandGestureHUDProps> = ({
  isActive,
  onToggleActive,
  onGesture,
  gestureState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<HandTracker | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!isActive) {
      if (trackerRef.current) {
        trackerRef.current.stop();
        trackerRef.current = null;
      }
      setIsLoading(false);
      setErrorMsg(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const tracker = new HandTracker();
    trackerRef.current = tracker;

    tracker.initialize(
      (gesture) => {
        onGesture(gesture);
      },
      (result: HandLandmarkerResult, video: HTMLVideoElement) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Render video frame mirrored
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Darken video slightly for neon contrast
        ctx.fillStyle = 'rgba(5, 10, 25, 0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw futuristic hand skeletal landmarks
        if (result.landmarks && result.landmarks.length > 0) {
          const lm = result.landmarks[0];

          // Draw holographic skeletal connection lines
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = 'rgba(0, 230, 255, 0.85)';
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 8;

          HAND_CONNECTIONS.forEach(([start, end]) => {
            const p1 = lm[start];
            const p2 = lm[end];
            ctx.beginPath();
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.stroke();
          });

          // Draw joints with gradient glow
          lm.forEach((p, index) => {
            const px = p.x * canvas.width;
            const py = p.y * canvas.height;

            const isTip = index === 4 || index === 8 || index === 12 || index === 16 || index === 20;
            ctx.fillStyle = isTip ? '#ffd700' : '#00f3ff';
            ctx.shadowColor = isTip ? '#ffe033' : '#00f3ff';
            ctx.shadowBlur = isTip ? 12 : 6;

            ctx.beginPath();
            ctx.arc(px, py, isTip ? 4.5 : 3.0, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.restore();
      },
      (err) => {
        console.error('Camera/MediaPipe error:', err);
        setErrorMsg('摄像头访问受限或未能检测到设备，请允许浏览器使用摄像头。');
        setIsLoading(false);
      }
    ).then(() => {
      setIsLoading(false);
    });

    return () => {
      tracker.stop();
      trackerRef.current = null;
    };
  }, [isActive, onGesture]);

  if (!isActive) return null;

  return (
    <div className="fixed top-16 left-4 sm:left-6 z-30 select-none transition-all duration-300">
      <div className="bg-[#0b111e]/95 border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden w-[260px] sm:w-[280px]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>MediaPipe 全息手势</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
              title="手势指南"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title={isMinimized ? '展开监控窗' : '最小化'}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onToggleActive}
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
              title="关闭手势控制"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized View */}
        {isMinimized && (
          <div className="px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              {gestureState?.label || '检测中...'}
            </span>
            <span className="text-[10px] text-sky-400 font-mono">运行中</span>
          </div>
        )}

        {/* Expanded View */}
        {!isMinimized && (
          <div className="p-3">
            {/* Camera / Skeleton Canvas */}
            <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800/80 shadow-inner">
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className="w-full h-full object-cover"
              />

              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-xs text-sky-300">
                  <Camera className="w-6 h-6 animate-spin text-sky-400" />
                  <span>正在初始化手势模型...</span>
                </div>
              )}

              {errorMsg && (
                <div className="absolute inset-0 bg-slate-950/90 p-3 flex flex-col items-center justify-center text-center text-xs text-rose-300">
                  <p>{errorMsg}</p>
                  <button
                    onClick={onToggleActive}
                    className="mt-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px]"
                  >
                    关闭
                  </button>
                </div>
              )}

              {/* Status Badge inside Canvas */}
              {!isLoading && !errorMsg && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px] text-white">
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5 truncate">
                    {gestureState?.label || '等待手部进入视野...'}
                  </span>
                  {gestureState && gestureState.confidence > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 flex-shrink-0">
                      {Math.round(gestureState.confidence * 100)}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Gesture Guide Panel */}
            {showGuide && (
              <div className="mt-2.5 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div className="font-semibold text-sky-300 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>手势互动指南</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🖐️</span>
                  <span><strong>张开掌心移动</strong>：自由旋转星系视角</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">👌</span>
                  <span><strong>拇食指捏合</strong>：缩放镜头距离</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">✊</span>
                  <span><strong>快速握拳</strong>：冻结/恢复行星运转</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">✌️</span>
                  <span><strong>胜利两指</strong>：镜头平滑跃迁至下一颗行星</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">☝️</span>
                  <span><strong>食指单点</strong>：全息激光锁定天体</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
