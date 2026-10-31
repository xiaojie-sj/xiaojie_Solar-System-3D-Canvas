import { useState, useRef, useCallback, useEffect } from 'react';
import { SolarCanvas } from './components/SolarCanvas';
import { CelestialDock } from './components/CelestialDock';
import { PlanetInfoCard } from './components/PlanetInfoCard';
import { HeaderBar } from './components/HeaderBar';
import { HoverTooltip } from './components/HoverTooltip';
import { SolarEngine } from './services/SolarEngine';
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

  // Next Planet button inside info card
  const handleSelectNext = () => {
    if (!selectedPlanet) {
      handleSelectPlanet('sun');
      return;
    }
    const curIndex = ALL_CELESTIAL_BODIES.findIndex(b => b.id === selectedPlanet.id);
    const nextIndex = (curIndex + 1) % ALL_CELESTIAL_BODIES.length;
    handleSelectPlanet(ALL_CELESTIAL_BODIES[nextIndex].id);
  };

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
        const planetIndex = parseInt(e.key, 10); // 1 = mercury, 2 = venus, etc.
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

      {/* 2. Top Header HUD */}
      <HeaderBar onResetView={handleResetView} />

      {/* 3. Hover Tooltip */}
      <HoverTooltip planet={hoveredPlanet} pos={hoverPos} />

      {/* 4. Selected Planet Astronomical Spec Card */}
      <PlanetInfoCard
        planet={selectedPlanet}
        onClose={() => handleSelectPlanet(null)}
        onSelectNext={handleSelectNext}
      />

      {/* 5. Sleek Collapsible Bottom Dock */}
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
      />
    </div>
  );
}
