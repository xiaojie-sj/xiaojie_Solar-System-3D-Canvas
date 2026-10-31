import React from 'react';
import { PlanetConfig } from '../types';

interface HoverTooltipProps {
  planet: PlanetConfig | null;
  pos: { x: number; y: number } | null;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ planet, pos }) => {
  if (!planet || !pos) return null;

  return (
    <div
      className="fixed pointer-events-none z-40 -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 bg-[#0b111e]/95 border border-sky-500/40 rounded-xl shadow-xl text-white text-xs flex items-center gap-2 select-none"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y - 12}px`,
      }}
    >
      <span
        className="w-2.5 h-2.5 rounded-full inline-block"
        style={{ backgroundColor: planet.color }}
      />
      <div className="font-semibold text-white">
        {planet.name}
        <span className="ml-1 text-[10px] text-slate-400 font-normal">
          {planet.nameEn}
        </span>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
        {planet.type}
      </span>
    </div>
  );
};
