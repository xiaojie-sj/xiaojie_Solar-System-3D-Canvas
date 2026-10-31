import React, { useState } from 'react';
import { ALL_CELESTIAL_BODIES } from '../data/planets';
import { 
  Play, 
  Pause, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Sliders, 
  Camera, 
  Compass, 
  Disc, 
  Sun,
  Globe
} from 'lucide-react';

interface CelestialDockProps {
  selectedPlanetId: string | null;
  onSelectPlanet: (id: string | null) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  timeScale: number;
  onChangeTimeScale: (scale: number) => void;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  showAtmospheres: boolean;
  onToggleAtmospheres: () => void;
  showAsteroidBelt: boolean;
  onToggleAsteroidBelt: () => void;
  realisticScale: boolean;
  onToggleScaleMode: () => void;
  onSetViewPreset: (preset: 'overview' | 'top' | 'ecliptic' | 'inner' | 'outer') => void;
  isHandTrackingActive?: boolean;
  onToggleHandTracking?: () => void;
}

export const CelestialDock: React.FC<CelestialDockProps> = ({
  selectedPlanetId,
  onSelectPlanet,
  isPaused,
  onTogglePause,
  timeScale,
  onChangeTimeScale,
  showOrbits,
  onToggleOrbits,
  showAtmospheres,
  onToggleAtmospheres,
  showAsteroidBelt,
  onToggleAsteroidBelt,
  realisticScale,
  onToggleScaleMode,
  onSetViewPreset,
  isHandTrackingActive,
  onToggleHandTracking,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'planets' | 'controls' | 'views'>('planets');

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[920px] transition-transform duration-300">
      {/* Collapse / Expand Tab Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-1 bg-[#0c1220] border border-[#1e293b] rounded-t-lg text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          title={isCollapsed ? '展开控制台 (H)' : '折叠控制台 (H)'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>展开控制台</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>折叠控制台</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="bg-[#0b111e]/96 border border-[#1e293b] rounded-2xl shadow-2xl p-3 text-slate-200">
          {/* Top Bar inside Dock: Navigation Tabs & Playback Quick Status */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('planets')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'planets'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>天体导览</span>
              </button>

              <button
                onClick={() => setActiveTab('controls')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'controls'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>运行参数 & 显示</span>
              </button>

              <button
                onClick={() => setActiveTab('views')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'views'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>视角预设</span>
              </button>
            </div>

            {/* Play/Pause, Speed & Hand Gesture Toggle */}
            <div className="flex items-center gap-2">
              {onToggleHandTracking && (
                <button
                  onClick={onToggleHandTracking}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isHandTrackingActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title={isHandTrackingActive ? '关闭手势控制' : '开启 MediaPipe 手势互动'}
                >
                  <span>🖐️</span>
                  <span className="hidden sm:inline">{isHandTrackingActive ? '手势开启' : '手势互动'}</span>
                </button>
              )}

              <button
                onClick={onTogglePause}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
                title={isPaused ? '恢复运转' : '暂停运转'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? '已暂停' : '运转中'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                <span>倍速:</span>
                <span className="text-white font-mono font-medium">{timeScale}x</span>
              </div>
            </div>
          </div>

          {/* Tab 1: Celestial Selector (Sun + 8 Planets) */}
          {activeTab === 'planets' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
              <button
                onClick={() => onSelectPlanet(null)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  selectedPlanetId === null
                    ? 'bg-sky-600/30 text-sky-300 border-sky-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>星系全景</span>
              </button>

              {ALL_CELESTIAL_BODIES.map(body => {
                const isSelected = selectedPlanetId === body.id;
                return (
                  <button
                    key={body.id}
                    onClick={() => onSelectPlanet(body.id)}
                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-sky-600/40 text-white border-sky-400 ring-1 ring-sky-400 shadow-md'
                        : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: body.color }}
                    />
                    <span>{body.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Controls & Toggles */}
          {activeTab === 'controls' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 py-1 text-xs">
              {/* Speed Slider */}
              <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                  <span>时间流逝速率</span>
                  <span className="font-mono text-sky-300">{timeScale}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="15"
                    step="0.1"
                    value={timeScale}
                    onChange={(e) => onChangeTimeScale(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex gap-1">
                    {[1, 5].map(speed => (
                      <button
                        key={speed}
                        onClick={() => onChangeTimeScale(speed)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          timeScale === speed
                            ? 'bg-sky-500 text-white border-sky-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Orbit & Atmosphere Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleOrbits}
                  className={`flex-1 py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    showOrbits
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                >
                  <Disc className="w-3.5 h-3.5" />
                  <span>轨道轨迹</span>
                </button>

                <button
                  onClick={onToggleAtmospheres}
                  className={`flex-1 py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    showAtmospheres
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>大气辉光</span>
                </button>
              </div>

              {/* Asteroid Belt & Scale Mode */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleAsteroidBelt}
                  className={`flex-1 py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    showAsteroidBelt
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>小行星带</span>
                </button>

                <button
                  onClick={onToggleScaleMode}
                  className={`flex-1 py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    realisticScale
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800'
                  }`}
                  title={realisticScale ? '当前为实际天文间距比例' : '当前为视觉观赏优化比例'}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{realisticScale ? '真实间距' : '观赏比例'}</span>
                </button>
              </div>

              {/* Hint badge */}
              <div className="hidden lg:flex items-center justify-center text-[11px] text-slate-400 bg-slate-900/40 px-3 py-1 rounded-xl border border-slate-800/60">
                <span>鼠标左键旋转 · 右键平移 · 滚轮缩放</span>
              </div>
            </div>
          )}

          {/* Tab 3: Camera View Presets */}
          {activeTab === 'views' && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
              <button
                onClick={() => onSetViewPreset('overview')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>全景斜仰 (45°)</span>
              </button>
              <button
                onClick={() => onSetViewPreset('top')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>黄道顶视 (90°)</span>
              </button>
              <button
                onClick={() => onSetViewPreset('ecliptic')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>黄道平视 (0°)</span>
              </button>
              <button
                onClick={() => onSetViewPreset('inner')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>聚焦内太阳系</span>
              </button>
              <button
                onClick={() => onSetViewPreset('outer')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>聚焦外层巨行星</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
