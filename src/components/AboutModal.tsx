import React from 'react';
import {
  X,
  Smartphone,
  Tv,
  FileSpreadsheet,
  Share2,
  ShieldCheck,
  Zap,
  FolderKanban,
  Sun,
  Download
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApkModal?: () => void;
  onOpenStageMode?: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenSheetModal?: () => void;
  onOpenProfilesModal?: () => void;
  displayName?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenApkModal,
  onOpenStageMode,
  displayName = "CYRIL'S RUNDOWN"
}) => {
  if (!isOpen) return null;

  const keyFeatures = [
    {
      icon: Smartphone,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/50 border-cyan-500/30',
      title: 'Foldable Split Screen',
      desc: 'Put the big timer on one side and your schedule on the other. Tap Swap Sides anytime.'
    },
    {
      icon: Tv,
      color: 'text-purple-400',
      bg: 'bg-purple-950/50 border-purple-500/30',
      title: 'Big Stage Timer',
      desc: 'Large, clear countdown numbers with yellow 30-second and red overtime warnings.'
    },
    {
      icon: FileSpreadsheet,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/50 border-emerald-500/30',
      title: 'Smart Schedule Reader',
      desc: 'Automatically reads item names, times, speakers, and notes from any spreadsheet or text.'
    },
    {
      icon: Share2,
      color: 'text-blue-400',
      bg: 'bg-blue-950/50 border-blue-500/30',
      title: 'Live Multi-Device Sync',
      desc: 'Share a view-only timer link or QR code so speakers and crew stay on the same clock.'
    },
    {
      icon: ShieldCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-950/50 border-amber-500/30',
      title: 'Works Offline & Android App',
      desc: 'Runs with no internet needed. Install the Android .APK app or save directly from your browser.'
    },
    {
      icon: Zap,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/50 border-indigo-500/30',
      title: 'Screen Flash & Auto Next',
      desc: 'Flash a quick alert to the stage screen, or turn on Auto Next to move to the next item at 00:00.'
    },
    {
      icon: FolderKanban,
      color: 'text-teal-400',
      bg: 'bg-teal-950/50 border-teal-500/30',
      title: 'Ready-Made Show Templates',
      desc: 'Start fast with templates for Church, Live TV, Conferences, Podcasts, and Sports.'
    },
    {
      icon: Sun,
      color: 'text-slate-300',
      bg: 'bg-slate-900/60 border-slate-700/50',
      title: 'True-Black Battery Saver & Stay Awake',
      desc: 'True-black OLED screen mode saves battery and keeps your screen from turning off.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-slate-200">
        
        {/* Clean Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <h3 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide">
              CYRIL WALUCHO'S <span className="text-emerald-400">RUNDOWN PRO</span>
            </h3>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800">
              v10.0
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close About"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          
          {/* Straightforward Summary */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-xs font-bold text-white">
              Live Show Schedule & Stage Timer
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Easy-to-use live event schedule and big countdown timer. Works offline with Excel, CSV, and Google Sheets across phones, tablets, foldables, laptops, and stage screens.
            </p>
          </div>

          {/* Key Features Grid (Clean & Scannable) */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Key Features
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {keyFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${f.bg}`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900/80 shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${f.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white leading-snug">
                        {f.title}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {f.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Creator & Device Compatibility Line */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 font-mono">
            <span>Created by <strong className="text-slate-200">Cyril Walucho</strong> &bull; Free for all productions</span>
            <span className="text-emerald-400">100% Offline Capable</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {onOpenApkModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenApkModal();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Android App</span>
              </button>
            )}

            {onOpenStageMode && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStageMode();
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Stage Timer</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
