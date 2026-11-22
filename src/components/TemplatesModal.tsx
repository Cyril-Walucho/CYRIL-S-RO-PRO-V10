import React from 'react';
import { RundownItem } from '../types/rundown';
import { RUNDOWN_TEMPLATES } from '../utils/csvParser';
import { Sparkles, X, Clock } from 'lucide-react';
import { formatTime } from '../utils/timeFormat';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateItems: RundownItem[]) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-slate-200 my-auto animate-in zoom-in-95 duration-150">
        <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>Ready-Made Schedule Templates</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-700 shrink-0">
                  With Color Tags
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Pick a starter schedule with colors and notes already filled in
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

        <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3">
          {RUNDOWN_TEMPLATES.map((tmpl, idx) => {
            const totalDur = tmpl.items.reduce((s, i) => s + i.durationSec, 0);
            return (
              <div
                key={idx}
                onClick={() => {
                  onSelectTemplate(tmpl.items);
                  onClose();
                }}
                className="group p-4 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {tmpl.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                      {tmpl.items.length} items
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{tmpl.description}</p>
                  
                  {/* Item Colors Preview */}
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">Colors:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {tmpl.items.map((it, sIdx) => {
                        const c = it.color || 'emerald';
                        const bg = 
                          c === 'cyan' ? 'bg-cyan-500' :
                          c === 'amber' ? 'bg-amber-500' :
                          c === 'purple' ? 'bg-purple-500' :
                          c === 'blue' ? 'bg-blue-500' :
                          c === 'orange' ? 'bg-orange-500' :
                          c === 'rose' ? 'bg-rose-500' :
                          c === 'fuchsia' ? 'bg-fuchsia-500' :
                          c === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500';
                        return (
                          <div 
                            key={sIdx} 
                            className={`w-3.5 h-2 rounded-full ${bg}`} 
                            title={`#${it.segmentNumber}: ${it.title} (${c})`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-cyan-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Total time: {formatTime(totalDur, true)}</span>
                  </div>
                </div>

                <button className="px-3.5 py-1.5 bg-slate-800 group-hover:bg-cyan-600 group-hover:text-white text-slate-300 rounded-lg text-xs font-semibold shrink-0 transition-colors self-end sm:self-center">
                  Use Template
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
