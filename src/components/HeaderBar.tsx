import React from 'react';
import { Orbit, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

interface HeaderBarProps {
  onResetView: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onResetView }) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="absolute top-4 left-4 sm:left-6 z-20 flex items-center justify-between pointer-events-none select-none max-w-[calc(100vw-32px)]">
      <div className="flex items-center gap-3 bg-[#0c1220]/90 border border-[#1e293b] rounded-2xl px-4 py-2.5 shadow-xl pointer-events-auto">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-sky-500 flex items-center justify-center shadow-md">
          <Orbit className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
            Solaris 3D
            <span className="text-xs font-normal text-slate-400">太阳系极度仿真漫游</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              NASA 官方实测模型
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">
            搭载 SDO/信使号/麦哲伦号/旅行者2号/卡西尼号官方测绘地貌 · 晨昏交替与本影遮挡
          </p>
        </div>

        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-3">
          <button
            onClick={onResetView}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="重置全景视角"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏体验'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
