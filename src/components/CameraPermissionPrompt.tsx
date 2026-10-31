import React from 'react';
import { Camera, Sparkles, X, ShieldCheck } from 'lucide-react';

interface CameraPermissionPromptProps {
  isOpen: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const CameraPermissionPrompt: React.FC<CameraPermissionPromptProps> = ({
  isOpen,
  onConfirm,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-[460px] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#0b111e]/98 border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,243,255,0.25)] text-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <Camera className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 pr-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>开启全息手势交互</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  MediaPipe
                </span>
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              点击下方按钮，浏览器将弹出摄像头授权窗口。授权后即可用<strong>开掌旋转、捏合缩放、握拳冻结、激光瞄准</strong>隔空操控太阳系。
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>本地边缘模型离线分析，视频画面绝不上传云端</span>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="关闭提示"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            暂不开启
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>弹出开启摄像头提示</span>
          </button>
        </div>
      </div>
    </div>
  );
};
