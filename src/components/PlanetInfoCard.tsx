import React from 'react';
import { PlanetConfig } from '../types';
import { 
  X, 
  Thermometer, 
  RotateCw, 
  Orbit, 
  CircleDot, 
  Layers, 
  Compass, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PlanetInfoCardProps {
  planet: PlanetConfig | null;
  onClose: () => void;
  onSelectNext: () => void;
}

export const PlanetInfoCard: React.FC<PlanetInfoCardProps> = ({
  planet,
  onClose,
  onSelectNext,
}) => {
  if (!planet) return null;

  return (
    <aside 
      aria-label={`${planet.name} 详细天文参数`}
      className="absolute top-16 right-4 sm:right-6 w-[340px] max-w-[calc(100vw-32px)] bg-[#0c1220]/95 border border-[#1e293b] rounded-2xl p-5 shadow-2xl text-slate-100 z-30 transition-all duration-300 max-h-[calc(100vh-140px)] overflow-y-auto pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block border border-white/20"
              style={{ backgroundColor: planet.color }}
            />
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {planet.name}
              <span className="text-xs font-normal text-slate-400 font-mono">
                {planet.nameEn}
              </span>
            </h2>
          </div>
          <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
            {planet.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="关闭卡片"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-slate-300">
        {planet.description}
      </p>

      {/* Grid Specs */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#131b2e] p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <CircleDot className="w-3.5 h-3.5 text-sky-400" />
            <span>赤道半径</span>
          </div>
          <div className="font-semibold text-white font-mono">
            {planet.realRadiusKm.toLocaleString()} km
          </div>
        </div>

        <div className="bg-[#131b2e] p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Orbit className="w-3.5 h-3.5 text-amber-400" />
            <span>日距 / 轨道</span>
          </div>
          <div className="font-semibold text-white font-mono">
            {planet.realDistanceAU > 0 ? `${planet.realDistanceAU} AU` : '中心恒星'}
          </div>
        </div>

        <div className="bg-[#131b2e] p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>公转周期</span>
          </div>
          <div className="font-semibold text-white font-mono">
            {planet.orbitPeriodDays > 0 ? `${planet.orbitPeriodDays} 天` : '—'}
          </div>
        </div>

        <div className="bg-[#131b2e] p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>自转倾角</span>
          </div>
          <div className="font-semibold text-white font-mono">
            {planet.axialTiltDeg}°
          </div>
        </div>

        <div className="bg-[#131b2e] p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span>温度环境</span>
          </div>
          <div className="font-medium text-[11px] text-slate-200 truncate" title={planet.temperature}>
            {planet.temperature}
          </div>
        </div>

        <div className="bg-[#131b2e] p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>表面重力 / 卫星</span>
          </div>
          <div className="font-semibold text-white font-mono text-[11px]">
            {planet.gravity} / {planet.moonsCount} 颗
          </div>
        </div>
      </div>

      {/* Facts */}
      {planet.facts && planet.facts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>天体秘辛与科学发现</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            {planet.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-1.5 leading-snug">
                <span className="text-amber-400 font-bold">•</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Switch Next Planet Button */}
      <button
        onClick={onSelectNext}
        className="mt-4 w-full py-2 px-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-2 shadow-lg transition-all"
      >
        <span>探索下一个天体</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
