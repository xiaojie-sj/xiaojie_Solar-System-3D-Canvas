import { useState, useRef, useCallback, useEffect } from 'react';
import { SolarCanvas } from './components/SolarCanvas';
import { CelestialDock } from './components/CelestialDock';
import { PlanetInfoCard } from './components/PlanetInfoCard';
import { HeaderBar } from './components/HeaderBar';
import { HoverTooltip } from './components/HoverTooltip';
import { HandGestureHUD } from './components/HandGestureHUD';
import { HolographicPointer } from './components/HolographicPointer';
import { CameraPermissionPrompt } from './components/CameraPermissionPrompt';
import { SolarEngine } from './services/SolarEngine';
import { GestureState } from './services/HandTracker';
import { PlanetConfig } from './types';
import { ALL_CELESTIAL_BODIES } from './data/planets';

export default function App() {
  const engineRef = useRef<SolarEngine | null>(null);

  const [selectedPlanet, setSelectedPlanet] = useState<PlanetConfig | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetConfig | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showAtmospheres, setShowAtmospheres] = useState<boolean>(true);
  const [showAsteroidBelt, setShowAsteroidBelt] = useState<boolean>(true);
  const [realisticScale, setRealisticScale] = useState<boolean>(false);

  // MediaPipe Hand Gesture Tracking State
  const [isHandTrackingActive, setIsHandTrackingActive] = useState<boolean>(false);
  const [showCameraPrompt, setShowCameraPrompt] = useState<boolean>(true);
  const [gestureState, setGestureState] = useState<GestureState | null>(null);
  const [targetLockPlanetName, setTargetLockPlanetName] = useState<string | null>(null);

  // Directly trigger browser camera permission prompt on user gesture
  const handleActivateCamera = async () => {
    setShowCameraPrompt(false);
    setIsHandTrackingActive(true);
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (e) {
      console.log('Browser camera permission prompt result:', e);
    }
  };

  const handleToggleHandTracking = () => {
    if (!isHandTrackingActive) {
      handleActivateCamera();
    } else {
      setIsHandTrackingActive(false);
    }
  };

  // Handle celestial selection
  const handleSelectPlanet = useCallback((id: string | null) => {
    if (engineRef.current) {
      engineRef.current.focusOnObject(id);
    }
  }, []);

  const handleSelectPlanetFromEngine = useCallback((planet: PlanetConfig | null) => {
    setSelectedPlanet(planet);
  }, []);

  const handleHoverPlanetFromEngine = useCallback(
    (planet: PlanetConfig | null, pos?: { x: number; y: number }) => {
      setHoveredPlanet(planet);
      setHoverPos(pos || null);
    },
    []
  );

  const handleTogglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    if (engineRef.current) {
      engineRef.current.isPaused = next;
    }
  };

  const handleChangeTimeScale = (scale: number) => {
    setTimeScale(scale);
    if (engineRef.current) {
      engineRef.current.timeScale = scale;
    }
  };

  const handleToggleOrbits = () => {
    const next = !showOrbits;
    setShowOrbits(next);
    if (engineRef.current) {
      engineRef.current.setOrbitsVisible(next);
    }
  };

  const handleToggleAtmospheres = () => {
    const next = !showAtmospheres;
    setShowAtmospheres(next);
    if (engineRef.current) {
      engineRef.current.setAtmospheresVisible(next);
    }
  };

  const handleToggleAsteroidBelt = () => {
    const next = !showAsteroidBelt;
    setShowAsteroidBelt(next);
    if (engineRef.current) {
      engineRef.current.setAsteroidBeltVisible(next);
    }
  };

  const handleToggleScaleMode = () => {
    const next = !realisticScale;
    setRealisticScale(next);
    if (engineRef.current) {
      engineRef.current.setScaleMode(next);
    }
  };

  const handleSetViewPreset = (preset: 'overview' | 'top' | 'ecliptic' | 'inner' | 'outer') => {
    if (engineRef.current) {
      engineRef.current.setViewPreset(preset);
    }
  };

  const handleResetView = () => {
    handleSelectPlanet(null);
  };

  // Next Planet button inside info card & gesture cycle
  const handleSelectNext = useCallback(() => {
    setSelectedPlanet((prev) => {
      if (!prev) {
        handleSelectPlanet(ALL_CELESTIAL_BODIES[0].id);
        return ALL_CELESTIAL_BODIES[0];
      }
      const curIndex = ALL_CELESTIAL_BODIES.findIndex((b) => b.id === prev.id);
      const nextIndex = (curIndex + 1) % ALL_CELESTIAL_BODIES.length;
      handleSelectPlanet(ALL_CELESTIAL_BODIES[nextIndex].id);
      return ALL_CELESTIAL_BODIES[nextIndex];
    });
  }, [handleSelectPlanet]);

  // Handle gesture events from HandTracker
  const handleGestureReceived = useCallback(
    (gesture: GestureState) => {
      setGestureState(gesture);

      if (engineRef.current) {
        const lockedName = engineRef.current.handleHandGesture(
          gesture,
          () => {
            handleSelectNext();
          },
          (paused) => {
            setIsPaused(paused);
          }
        );
        setTargetLockPlanetName(lockedName);
      }
    },
    [handleSelectNext]
  );

  // Keyboard shortcut support (Space: pause, Esc: overview, 0-8: celestial jump)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === 'Escape') {
        handleResetView();
      } else if (e.key === '0') {
        handleSelectPlanet('sun');
      } else if (e.key >= '1' && e.key <= '8') {
        const planetIndex = parseInt(e.key, 10);
        if (planetIndex < ALL_CELESTIAL_BODIES.length) {
          handleSelectPlanet(ALL_CELESTIAL_BODIES[planetIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, handleResetView, handleSelectPlanet]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#03050c] select-none">
      {/* 1. Stable WebGL 3D Canvas */}
      <SolarCanvas
        engineRef={engineRef}
        onSelectPlanet={handleSelectPlanetFromEngine}
        onHoverPlanet={handleHoverPlanetFromEngine}
      />

      {/* 2. Top Header HUD with Hand Gesture Toggle */}
      <HeaderBar
        onResetView={handleResetView}
        isHandTrackingActive={isHandTrackingActive}
        onToggleHandTracking={handleToggleHandTracking}
      />

      {/* 3. Browser Camera Permission Activation Banner */}
      <CameraPermissionPrompt
        isOpen={showCameraPrompt}
        onConfirm={handleActivateCamera}
        onDismiss={() => setShowCameraPrompt(false)}
      />

      {/* 4. MediaPipe Hand Gesture Monitor & Camera HUD */}
      <HandGestureHUD
        isActive={isHandTrackingActive}
        onToggleActive={() => setIsHandTrackingActive(false)}
        onGesture={handleGestureReceived}
        gestureState={gestureState}
      />

      {/* 5. Holographic Pointer Reticle (Tracks index finger) */}
      <HolographicPointer
        gestureState={gestureState}
        targetPlanetName={targetLockPlanetName}
      />

      {/* 6. Hover Tooltip */}
      <HoverTooltip planet={hoveredPlanet} pos={hoverPos} />

      {/* 7. Selected Planet Astronomical Spec Card */}
      <PlanetInfoCard
        planet={selectedPlanet}
        onClose={() => handleSelectPlanet(null)}
        onSelectNext={handleSelectNext}
      />

      {/* 8. Sleek Collapsible Bottom Dock */}
      <CelestialDock
        selectedPlanetId={selectedPlanet ? selectedPlanet.id : null}
        onSelectPlanet={handleSelectPlanet}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        timeScale={timeScale}
        onChangeTimeScale={handleChangeTimeScale}
        showOrbits={showOrbits}
        onToggleOrbits={handleToggleOrbits}
        showAtmospheres={showAtmospheres}
        onToggleAtmospheres={handleToggleAtmospheres}
        showAsteroidBelt={showAsteroidBelt}
        onToggleAsteroidBelt={handleToggleAsteroidBelt}
        realisticScale={realisticScale}
        onToggleScaleMode={handleToggleScaleMode}
        onSetViewPreset={handleSetViewPreset}
        isHandTrackingActive={isHandTrackingActive}
        onToggleHandTracking={handleToggleHandTracking}
      />
    </div>
  );
}
