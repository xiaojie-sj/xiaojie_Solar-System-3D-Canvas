import React from 'react';
import { GestureState } from '../services/HandTracker';

interface HolographicPointerProps {
  gestureState: GestureState | null;
  targetPlanetName?: string | null;
}

export const HolographicPointer: React.FC<HolographicPointerProps> = ({
  gestureState,
  targetPlanetName,
}) => {
  if (!gestureState || (gestureState.type !== 'pointing' && gestureState.type !== 'pinch')) {
    return null;
  }

  const { indexTip, type } = gestureState;
  const screenX = indexTip.x * window.innerWidth;
  const screenY = indexTip.y * window.innerHeight;

  const isPinch = type === 'pinch';

  return (
    <div
      className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out select-none"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
      }}
    >
      {/* Outer Rotating Sci-Fi Ring */}
      <div className={`relative flex items-center justify-center ${isPinch ? 'w-14 h-14' : 'w-20 h-20'}`}>
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-1.5 rounded-full border border-cyan-300/60" />

        {/* Center Crosshairs */}
        <div className="absolute w-2.5 h-0.5 bg-sky-300" />
        <div className="absolute h-2.5 w-0.5 bg-sky-300" />
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#00f3ff]" />

        {/* Corner Reticles */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-sky-400" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-sky-400" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-sky-400" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-sky-400" />
      </div>

      {/* Target Lock Label */}
      <div className="mt-2 text-center whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-full bg-slate-950/90 border border-sky-500/50 text-[10px] font-mono text-cyan-300 shadow-lg">
          {targetPlanetName ? `锁定: ${targetPlanetName}` : (isPinch ? '缩放定位中' : '全息激光瞄准')}
        </span>
      </div>
    </div>
  );
};
