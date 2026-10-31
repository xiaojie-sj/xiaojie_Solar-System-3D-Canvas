import React, { useEffect, useRef } from 'react';
import { SolarEngine } from '../services/SolarEngine';
import { PlanetConfig } from '../types';

interface SolarCanvasProps {
  engineRef: React.MutableRefObject<SolarEngine | null>;
  onSelectPlanet: (planet: PlanetConfig | null) => void;
  onHoverPlanet: (planet: PlanetConfig | null, pos?: { x: number; y: number }) => void;
}

export const SolarCanvas: React.FC<SolarCanvasProps> = ({
  engineRef,
  onSelectPlanet,
  onHoverPlanet,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new SolarEngine({
      container: mountRef.current,
      onSelectPlanet,
      onHoverPlanet,
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [engineRef, onSelectPlanet, onHoverPlanet]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#03050c]"
      style={{ touchAction: 'none' }}
    />
  );
};
