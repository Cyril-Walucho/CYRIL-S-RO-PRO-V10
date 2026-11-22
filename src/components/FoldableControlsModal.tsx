import React from 'react';
import { FoldableConfig } from '../types/rundown';
import { 
  Smartphone, 
  X, 
  ArrowUpDown, 
  ArrowLeftRight, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Check, 
  Layers,
  Columns2,
  Tv,
  ListTree
} from 'lucide-react';

interface FoldableControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FoldableConfig;
  onUpdateConfig: (updates: Partial<FoldableConfig>) => void;
}

export const FoldableControlsModal: React.FC<FoldableControlsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-slate-200 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">Foldable Split Screen</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Show Schedule and Timer on separate halves of a foldable phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 text-xs overscroll-contain">
          {/* Main Activation Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Turn On Foldable Split Screen</span>
                {config.autoDetected && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-[10px] text-emerald-400 border border-emerald-800 font-mono">
                    Foldable Detected
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">
                Puts the Timer on one half of the screen and the Schedule on the other half.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isFoldableMode}
                onChange={(e) => onUpdateConfig({ isFoldableMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Foldable Screen View: Split, Big Timer, or Schedule Only */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>Screen View:</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                {config.viewMode === 'stage' ? 'Big Timer' : config.viewMode === 'rundown' ? 'Schedule' : 'Split'}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateConfig({ viewMode: 'split' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  (config.viewMode || 'split') === 'split'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Columns2 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs">Split Screen</span>
                <span className="text-[9px] text-slate-400">Two Halves</span>
              </button>

              <button
                onClick={() => onUpdateConfig({ viewMode: 'stage' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  config.viewMode === 'stage'
                    ? 'bg-purple-950/70 border-purple-400 text-white shadow-sm ring-1 ring-purple-500/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Tv className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs">Big Timer</span>
                <span className="text-[9px] text-slate-400">Full Screen</span>
              </button>

              <button
                onClick={() => onUpdateConfig({ viewMode: 'rundown' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  config.viewMode === 'rundown'
                    ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <ListTree className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs">Schedule Only</span>
                <span className="text-[9px] text-slate-400">Full List</span>
              </button>
            </div>
          </div>

          {/* Orientation: Top/Bottom vs Left/Right */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Split Direction:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateConfig({ orientation: 'vertical' })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  config.orientation === 'vertical'
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <ArrowUpDown className="w-5 h-5 text-cyan-400" />
                <div className="text-center">
                  <div className="font-bold text-xs">Top / Bottom Halves</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Fold half upright
                  </div>
                </div>
              </button>

              <button
                onClick={() => onUpdateConfig({ orientation: 'horizontal' })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  config.orientation === 'horizontal'
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                <div className="text-center">
                  <div className="font-bold text-xs">Left / Right Halves</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Book style side-by-side
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Swap Halves Position */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Swap Sides</div>
              <div className="text-[11px] text-slate-400">
                {config.orientation === 'vertical'
                  ? config.swapHalves
                    ? 'Now: Schedule on Top, Timer on Bottom'
                    : 'Now: Timer on Top, Schedule on Bottom (Best for table use)'
                  : config.swapHalves
                  ? 'Now: Timer on Left, Schedule on Right'
                  : 'Now: Schedule on Left, Timer on Right'}
              </div>
            </div>
            <button
              onClick={() => onUpdateConfig({ swapHalves: !config.swapHalves })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer active:scale-95"
            >
              Swap Sides
            </button>
          </div>

          {/* Center Fold Gap */}
          <div className="space-y-1.5 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Center Fold Gap:
              </label>
              <span className="font-mono text-cyan-300 font-bold">{config.hingeGapPx}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="28"
              step="2"
              value={config.hingeGapPx}
              onChange={(e) => onUpdateConfig({ hingeGapPx: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0px (No gap)</span>
              <span>12px (Standard Fold)</span>
              <span>24px (Wide gap)</span>
            </div>
          </div>

          {/* Phone Presets */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">
              Quick Phone Presets:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() =>
                  onUpdateConfig({
                    isFoldableMode: true,
                    orientation: 'vertical',
                    hingeGapPx: 12,
                    swapHalves: false,
                    devicePreset: 'galaxy-fold'
                  })
                }
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500 text-[11px] text-slate-300 text-center cursor-pointer"
              >
                Galaxy Z Fold
              </button>
              <button
                onClick={() =>
                  onUpdateConfig({
                    isFoldableMode: true,
                    orientation: 'vertical',
                    hingeGapPx: 14,
                    swapHalves: false,
                    devicePreset: 'pixel-fold'
                  })
                }
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500 text-[11px] text-slate-300 text-center cursor-pointer"
              >
                Pixel Fold
              </button>
              <button
                onClick={() =>
                  onUpdateConfig({
                    isFoldableMode: true,
                    orientation: 'vertical',
                    hingeGapPx: 8,
                    swapHalves: false,
                    devicePreset: 'custom'
                  })
                }
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500 text-[11px] text-slate-300 text-center cursor-pointer"
              >
                OnePlus Open
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
