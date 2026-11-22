import React from 'react';
import { LandscapeViewMode } from '../utils/useOrientationDetection';
import { Columns2, Tv, ListTree, RotateCw, X, Check } from 'lucide-react';

interface LandscapeRotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: LandscapeViewMode;
  onSelectMode: (mode: LandscapeViewMode) => void;
}

export const LandscapeRotationModal: React.FC<LandscapeRotationModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 px-4 py-2.5 sm:py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <span>Phone Turned Sideways</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  AUTO
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Pick how you want to view your screen:
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Layout Choice Cards */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Option 1: Split Screen (50/50) */}
          <button
            onClick={() => onSelectMode('split')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 cursor-pointer transition-all active:scale-95 group ${
              currentMode === 'split'
                ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border ${
                currentMode === 'split'
                  ? 'bg-cyan-900/80 border-cyan-400/60 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-cyan-300'
              }`}
            >
              <Columns2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-white group-hover:text-cyan-200">
                Split Screen
              </div>
              <div className="text-[10px] font-mono text-cyan-400 mt-0.5">Side by Side</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Schedule on the left, Countdown Timer on the right
              </p>
            </div>
            {currentMode === 'split' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-900/70 px-2 py-0.5 rounded-full mt-auto">
                <Check className="w-3 h-3" /> ON
              </span>
            )}
          </button>

          {/* Option 2: Big Timer Only */}
          <button
            onClick={() => onSelectMode('stage')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 cursor-pointer transition-all active:scale-95 group ${
              currentMode === 'stage'
                ? 'bg-purple-950/70 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border ${
                currentMode === 'stage'
                  ? 'bg-purple-900/80 border-purple-400/60 text-purple-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-purple-300'
              }`}
            >
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-white group-hover:text-purple-200">
                Big Timer
              </div>
              <div className="text-[10px] font-mono text-purple-400 mt-0.5">Timer Only</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Huge countdown clock, speaker notes &amp; screen flashes
              </p>
            </div>
            {currentMode === 'stage' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-900/70 px-2 py-0.5 rounded-full mt-auto">
                <Check className="w-3 h-3" /> ON
              </span>
            )}
          </button>

          {/* Option 3: Schedule Only */}
          <button
            onClick={() => onSelectMode('rundown')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 cursor-pointer transition-all active:scale-95 group ${
              currentMode === 'rundown'
                ? 'bg-emerald-950/70 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border ${
                currentMode === 'rundown'
                  ? 'bg-emerald-900/80 border-emerald-400/60 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-emerald-300'
              }`}
            >
              <ListTree className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-white group-hover:text-emerald-200">
                Schedule Only
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-0.5">List Only</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Full list of items, speakers &amp; times
              </p>
            </div>
            {currentMode === 'rundown' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/70 px-2 py-0.5 rounded-full mt-auto">
                <Check className="w-3 h-3" /> ON
              </span>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="shrink-0 px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>You can switch anytime at the top bar.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
