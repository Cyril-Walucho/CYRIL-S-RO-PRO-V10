import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  BatteryMedium, 
  Smartphone, 
  Monitor, 
  Eye, 
  Share2, 
  Maximize2, 
  Minimize2, 
  Check, 
  Copy,
  Radio,
  Layers,
  ArrowUpDown,
  ArrowLeftRight,
  Sliders,
  Sparkles,
  Download,
  FolderKanban,
  Tv,
  Menu,
  X,
  FileSpreadsheet,
  FileJson,
  UploadCloud,
  ShieldCheck,
  ExternalLink,
  RotateCw,
  Columns2,
  ListTree,
  Sun,
  Moon,
  Edit2,
  Info,
  ChevronRight,
  ChevronDown,
  Palette
} from 'lucide-react';
import { getCurrentTimeOfDay } from '../utils/timeFormat';
import { FoldableConfig } from '../types/rundown';
import { LandscapeViewMode } from '../utils/useOrientationDetection';
import { isApkEnvironment } from '../utils/apiConfig';
import { AboutModal } from './AboutModal';

interface AndroidFrameProps {
  children: React.ReactNode;
  sessionId: string;
  onSessionChange?: (newSessionId: string) => void;
  isStageMode: boolean;
  onToggleStageMode: () => void;
  activeTab: 'split' | 'rundown' | 'timer';
  onTabChange: (tab: 'split' | 'rundown' | 'timer') => void;
  foldableConfig: FoldableConfig;
  onOpenFoldableModal: () => void;
  onQuickToggleFoldable: () => void;
  onSwapFoldHalves: () => void;
  onOpenApkModal: () => void;
  activeProfileName?: string;
  onOpenProfilesModal?: () => void;
  onOpenShareDisplayModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenSheetModal?: () => void;
  onOpenCsvModal?: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenAboutModal?: () => void;
  isLandscape?: boolean;
  landscapeMode?: LandscapeViewMode;
  onChangeLandscapeMode?: (mode: LandscapeViewMode) => void;
  onOpenRotationModal?: () => void;
  displayName?: string;
  onUpdateDisplayName?: (name: string) => void;
  onUpdateFoldableConfig?: (updates: Partial<FoldableConfig>) => void;
  autoAdvance?: boolean;
  onToggleAutoAdvance?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  sessionId,
  onSessionChange,
  isStageMode,
  onToggleStageMode,
  activeTab,
  onTabChange,
  foldableConfig,
  onOpenFoldableModal,
  onQuickToggleFoldable,
  onSwapFoldHalves,
  onOpenApkModal,
  activeProfileName,
  onOpenProfilesModal,
  onOpenShareDisplayModal,
  onOpenBackupModal,
  onOpenSheetModal,
  onOpenCsvModal,
  onOpenTemplatesModal,
  onOpenAboutModal,
  isLandscape = false,
  landscapeMode = 'split',
  onChangeLandscapeMode,
  onOpenRotationModal,
  displayName = "CYRIL'S RUNDOWN",
  onUpdateDisplayName,
  onUpdateFoldableConfig,
  autoAdvance = false,
  onToggleAutoAdvance
}) => {
  const isApk = isApkEnvironment();
  const [editingName, setEditingName] = useState(displayName);
  const [isEditingNameOpen, setIsEditingNameOpen] = useState(false);
  const [internalAboutModalOpen, setInternalAboutModalOpen] = useState(false);

  const handleOpenAbout = () => {
    if (onOpenAboutModal) {
      onOpenAboutModal();
    } else {
      setInternalAboutModalOpen(true);
    }
  };

  useEffect(() => {
    setEditingName(displayName);
  }, [displayName]);

  const [deviceFrameMode, setDeviceFrameMode] = useState<'none' | 'foldable' | 'tablet'>('none');
  
  type ThemeMode = 'slate' | 'dark' | 'system';
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cyril_ro_theme_mode');
      if (saved === 'slate' || saved === 'dark' || saved === 'system') return saved;
      const oldTheme = localStorage.getItem('cyril_ro_theme');
      if (oldTheme === 'oled') return 'dark';
      return 'slate';
    }
    return 'slate';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'slate' | 'dark'>('slate');

  const changeThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cyril_ro_theme_mode', mode);
    }
  };

  useEffect(() => {
    const updateTheme = () => {
      let active: 'slate' | 'dark' = 'slate';
      if (themeMode === 'system') {
        const isSysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isSysDark ? 'dark' : 'slate';
      } else {
        active = themeMode;
      }
      setEffectiveTheme(active);

      if (typeof window !== 'undefined') {
        if (active === 'dark') {
          document.documentElement.classList.add('theme-oled');
          document.body.classList.add('bg-black');
        } else {
          document.documentElement.classList.remove('theme-oled');
          document.body.classList.remove('bg-black');
        }
      }
    };

    updateTheme();

    if (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', updateTheme);
      return () => mql.removeEventListener('change', updateTheme);
    }
  }, [themeMode]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);
  const [clockTime, setClockTime] = useState(getCurrentTimeOfDay().slice(0, 5));
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<'stage' | 'schedule' | 'files' | 'appearance' | 'device' | null>(null);

  const toggleCategory = (cat: 'stage' | 'schedule' | 'files' | 'appearance' | 'device') => {
    setExpandedCategory(prev => (prev === cat ? null : cat));
  };

  // Time ticker for Android status bar
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClockTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Screen Wake Lock API for live broadcast tablets and foldables
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          wakeLockSentinel.addEventListener('release', () => {
            setWakeLockActive(false);
          });
        }
      } catch {
        setWakeLockActive(false);
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (wakeLockSentinel) wakeLockSentinel.release();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFullscreenBrowser = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const cycleDeviceFrame = () => {
    if (deviceFrameMode === 'none') {
      setDeviceFrameMode('foldable');
    } else if (deviceFrameMode === 'foldable') {
      setDeviceFrameMode('tablet');
    } else {
      setDeviceFrameMode('none');
    }
  };

  return (
    <div className={`h-full w-full ${effectiveTheme === 'dark' ? 'bg-black' : 'bg-slate-950'} flex flex-col overflow-hidden text-slate-100`}>
      {/* Top Application Bar (Uncluttered: App Name + Hamburger, Profiles, Foldable/Split) */}
      <header className="px-2.5 sm:px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-20">
        {/* Left Side: Hamburger Menu + App Name */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Hamburger Menu Button right next to App Name */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer flex items-center justify-center shadow-sm active:scale-95 shrink-0"
            title="Open Menu & Settings"
            aria-label="Open Menu & Settings"
          >
            <Menu className="w-4 h-4 text-cyan-400" />
          </button>

          {/* App Branding */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981] shrink-0" />
            {(() => {
              const words = displayName.trim().split(' ');
              const first = words[0] || "CYRIL'S";
              const rest = words.slice(1).join(' ');
              return (
                <span className="font-display font-extrabold text-xs sm:text-base tracking-wide text-white truncate max-w-[130px] sm:max-w-xs">
                  {first}{' '}
                  {rest ? (
                    <span className="text-emerald-400">{rest}</span>
                  ) : (
                    <span className="text-emerald-400">RUNDOWN</span>
                  )}
                </span>
              );
            })()}
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-slate-800/90 border border-slate-700 shrink-0">
              Live Free
            </span>
          </div>
        </div>

        {/* Right Side: Fullscreen, Theme, Saved Shows, Split */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Fullscreen Toggle Button */}
          <button
            onClick={handleFullscreenBrowser}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center justify-center active:scale-95 shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fill Full Screen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            )}
          </button>

          {/* Quick Theme Switcher Button (Navy -> Black -> Auto) */}
          <button
            onClick={() => {
              const next: ThemeMode = themeMode === 'slate' ? 'dark' : themeMode === 'dark' ? 'system' : 'slate';
              changeThemeMode(next);
            }}
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 ${
              effectiveTheme === 'dark'
                ? 'bg-black text-amber-300 border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : themeMode === 'system'
                ? 'bg-slate-900 text-cyan-300 border-cyan-500/70'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={`Theme: ${themeMode === 'system' ? 'Auto' : themeMode === 'dark' ? 'Pure Black' : 'Navy'}. Tap to switch.`}
          >
            <span className={`w-2 h-2 rounded-full ${effectiveTheme === 'dark' ? 'bg-amber-400' : themeMode === 'system' ? 'bg-cyan-400' : 'bg-slate-400'}`} />
            <span className="text-[10px] sm:text-xs uppercase">{themeMode === 'system' ? 'AUTO' : themeMode === 'dark' ? 'BLACK' : 'NAVY'}</span>
          </button>

          {/* Saved Shows Button */}
          {onOpenProfilesModal && (
            <button
              onClick={onOpenProfilesModal}
              className="flex items-center gap-1 sm:gap-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 rounded-lg px-2 sm:px-2.5 py-1 text-xs text-cyan-200 transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="Switch or manage saved shows and events"
            >
              <FolderKanban className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform" />
              <span className="font-bold font-display truncate max-w-[65px] sm:max-w-[130px] text-white">
                {activeProfileName || 'Shows'}
              </span>
            </button>
          )}

          {/* Foldable / Split Button */}
          <button
            onClick={onOpenFoldableModal}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer active:scale-95 shrink-0 ${
              foldableConfig.isFoldableMode
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Set up Foldable Split-Screen (Top/Bottom or Side-by-Side)"
          >
            <Smartphone className={`w-3.5 h-3.5 ${foldableConfig.isFoldableMode ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>
              {foldableConfig.isFoldableMode
                ? foldableConfig.orientation === 'vertical'
                  ? 'Split: Top/Bottom'
                  : 'Split: Side/Side'
                : 'Split'}
            </span>
          </button>
        </div>
      </header>


      {/* Hamburger Menu Drawer with Neat Clickable Categories */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-start animate-in fade-in duration-150">
          <div className="w-full max-w-sm sm:max-w-md h-full bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl overflow-hidden text-slate-200">
            {/* Drawer Header */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="font-display font-extrabold text-sm text-white tracking-wide">
                  SETTINGS
                </span>
                <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                  TAP A CATEGORY
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close Settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: Neat Expandable Categories */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-2.5 text-xs">
              {/* CATEGORY 1: STAGE & SCREEN DISPLAY */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory('stage')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/30 shrink-0">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm">Stage &amp; Screen View</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Big timer view, share screen link, landscape layout
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 px-1.5 py-0.5 rounded border border-purple-800/70">
                      {isStageMode ? 'STAGE ON' : landscapeMode.toUpperCase()}
                    </span>
                    {expandedCategory === 'stage' ? (
                      <ChevronDown className="w-4 h-4 text-purple-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedCategory === 'stage' && (
                  <div className="p-2.5 pt-1 border-t border-slate-800/80 space-y-1.5 bg-slate-950/60">
                    {/* Big Stage Timer */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleStageMode();
                      }}
                      className="w-full p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/35 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Tv className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Big Stage Timer</div>
                          <div className="text-[11px] text-slate-400">
                            {isStageMode ? 'Go back to schedule list' : 'Show only the giant countdown numbers'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700">
                        {isStageMode ? 'EXIT' : 'OPEN'}
                      </span>
                    </button>

                    {/* Share Read-Only Stage Screen */}
                    {onOpenShareDisplayModal && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenShareDisplayModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Eye className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Share Stage Screen Link &amp; QR</div>
                            <div className="text-[11px] text-slate-400">
                              Let speakers &amp; crew view the timer safely on their phone
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800">
                          SHARE
                        </span>
                      </button>
                    )}

                    {/* Multi-Device Control Link (Web only) */}
                    {!isApk && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowShareModal(true);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Share2 className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Control From Another Device</div>
                            <div className="text-[11px] text-slate-400">
                              Keep timer &amp; schedule in sync across laptops &amp; tablets
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    )}

                    {/* Screen Layout When Sideways */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenRotationModal) {
                          onOpenRotationModal();
                        } else if (onChangeLandscapeMode) {
                          const next = landscapeMode === 'split' ? 'stage' : landscapeMode === 'stage' ? 'rundown' : 'split';
                          onChangeLandscapeMode(next);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <RotateCw className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Sideways (Landscape) Layout</div>
                          <div className="text-[11px] text-slate-400">
                            Now using: <strong className="text-cyan-300 capitalize">{landscapeMode === 'rundown' ? 'Schedule Only' : landscapeMode === 'stage' ? 'Timer Only' : 'Split 50/50'}</strong>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                        CHANGE
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* CATEGORY 2: SCHEDULE & SHOW SETTINGS */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory('schedule')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30 shrink-0">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm">Shows, Templates &amp; Timer</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Switch shows, templates, auto-next &amp; header title
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-800/70">
                      {autoAdvance ? 'AUTO-NEXT' : 'MANUAL'}
                    </span>
                    {expandedCategory === 'schedule' ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedCategory === 'schedule' && (
                  <div className="p-2.5 pt-1 border-t border-slate-800/80 space-y-1.5 bg-slate-950/60">
                    {/* Saved Shows Manager */}
                    {onOpenProfilesModal && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenProfilesModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <FolderKanban className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Saved Shows &amp; Events</div>
                            <div className="text-[11px] text-slate-400">
                              Active: <strong className="text-cyan-300">{activeProfileName || 'Main Show'}</strong>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                          SWITCH
                        </span>
                      </button>
                    )}

                    {/* Ready-Made Templates */}
                    {onOpenTemplatesModal && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenTemplatesModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Ready-Made Templates</div>
                            <div className="text-[11px] text-slate-400">
                              Church service, conference, podcast, news &amp; more
                            </div>
                          </div>
                        </div>
                        <span className="text-slate-400 text-xs">&rarr;</span>
                      </button>
                    )}

                    {/* Auto-Start Next Item */}
                    {onToggleAutoAdvance && (
                      <button
                        onClick={() => onToggleAutoAdvance()}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Auto-Start Next Item at 00:00</div>
                            <div className="text-[11px] text-slate-400">
                              Automatically move to the next part when time runs out
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          autoAdvance
                            ? 'text-cyan-300 bg-cyan-950 border-cyan-700'
                            : 'text-slate-400 bg-slate-800 border-slate-700'
                        }`}>
                          {autoAdvance ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    )}

                    {/* Editable App Header Name */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                          Top Bar Name: <span className="text-cyan-300 truncate max-w-[130px]">{displayName}</span>
                        </span>
                        <button
                          onClick={() => setIsEditingNameOpen(!isEditingNameOpen)}
                          className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          {isEditingNameOpen ? 'Cancel' : 'Rename'}
                        </button>
                      </div>

                      {isEditingNameOpen && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="e.g. SUNDAY SERVICE"
                            maxLength={32}
                            className="flex-1 bg-slate-950 border border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (editingName.trim()) {
                                onUpdateDisplayName?.(editingName.trim());
                                setIsEditingNameOpen(false);
                              }
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer active:scale-95"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY 3: IMPORT, EXPORT & BACKUPS */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory('files')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm">Upload Files &amp; Backups</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Import Excel, Word, text, Google Sheets or save backup
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/70">
                      FILES
                    </span>
                    {expandedCategory === 'files' ? (
                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedCategory === 'files' && (
                  <div className="p-2.5 pt-1 border-t border-slate-800/80 space-y-1.5 bg-slate-950/60">
                    {/* Smart Upload / Google Sheets */}
                    {onOpenSheetModal && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSheetModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Smart Schedule Upload</div>
                            <div className="text-[11px] text-slate-400">
                              Auto-read any Excel, Word (.docx), text, or Google Sheet
                            </div>
                          </div>
                        </div>
                        <span className="text-slate-400 text-xs">&rarr;</span>
                      </button>
                    )}

                    {/* CSV Import / Export */}
                    {onOpenCsvModal && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenCsvModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <UploadCloud className="w-4 h-4 text-sky-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Spreadsheet Import &amp; Save (.CSV)</div>
                            <div className="text-[11px] text-slate-400">
                              Load from text/file or export as a spreadsheet
                            </div>
                          </div>
                        </div>
                        <span className="text-slate-400 text-xs">&rarr;</span>
                      </button>
                    )}

                    {/* Backup & Restore */}
                    {onOpenBackupModal && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenBackupModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileJson className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Save or Restore Full Backup</div>
                            <div className="text-[11px] text-slate-400">
                              Keep a safe copy of your show or move it to another phone
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                          BACKUP
                        </span>
                      </button>
                    )}

                    {/* Offline Storage Status (APK) */}
                    {isApk && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] text-slate-300">Saved locally on phone ({sessionId})</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">OFFLINE</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CATEGORY 4: LOOK & DISPLAY */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory('appearance')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-amber-950 text-amber-300 border border-amber-500/30 shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm">Theme &amp; Screen Display</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Colors, fullscreen view &amp; keep screen awake
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800/70 uppercase">
                      {themeMode === 'system' ? 'Auto' : themeMode === 'dark' ? 'Black' : 'Navy'}
                    </span>
                    {expandedCategory === 'appearance' ? (
                      <ChevronDown className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedCategory === 'appearance' && (
                  <div className="p-2.5 pt-1.5 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
                    {/* Color Theme Selector */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Color Theme</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => changeThemeMode('slate')}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                            themeMode === 'slate'
                              ? 'bg-slate-800 border-cyan-400 text-white'
                              : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                            {themeMode === 'slate' && <Check className="w-2.5 h-2.5 text-cyan-400" />}
                          </div>
                          <span className="font-bold text-[11px]">Navy</span>
                        </button>

                        <button
                          onClick={() => changeThemeMode('dark')}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                            themeMode === 'dark'
                              ? 'bg-black border-amber-400 text-amber-300'
                              : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-black border border-amber-500/60 flex items-center justify-center">
                            {themeMode === 'dark' && <Check className="w-2.5 h-2.5 text-amber-400" />}
                          </div>
                          <span className="font-bold text-[11px]">Pure Black</span>
                        </button>

                        <button
                          onClick={() => changeThemeMode('system')}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                            themeMode === 'system'
                              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                              : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-slate-900 border border-cyan-600 flex items-center justify-center">
                            {themeMode === 'system' && <Check className="w-2.5 h-2.5 text-cyan-400" />}
                          </div>
                          <span className="font-bold text-[11px]">Match Phone</span>
                        </button>
                      </div>
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleFullscreenBrowser();
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Maximize2 className="w-4 h-4 text-slate-300 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Fill Whole Screen (Fullscreen)</div>
                          <div className="text-[11px] text-slate-400">Hide browser top bar for a cleaner view</div>
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs">&rarr;</span>
                    </button>

                    {/* Screen Size Preview */}
                    <button
                      onClick={() => cycleDeviceFrame()}
                      className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Preview Device Size</div>
                          <div className="text-[11px] text-slate-400">
                            Showing:{' '}
                            <strong className="text-cyan-300">
                              {deviceFrameMode === 'foldable'
                                ? 'Foldable Phone'
                                : deviceFrameMode === 'tablet'
                                ? 'Tablet'
                                : 'Full Screen'}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        SWITCH
                      </span>
                    </button>

                    {/* Keep Screen Awake */}
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span className="font-medium text-slate-300">Keep Screen Awake:</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                        {wakeLockActive ? 'ON (WON’T SLEEP)' : 'STANDBY'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY 5: FOLDABLE & ANDROID APP */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory('device')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/30 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm">Foldable &amp; Offline Phone App</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Fold split-screen options &amp; Android .APK download
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 px-1.5 py-0.5 rounded border border-indigo-800/70">
                      {isApk ? 'APK' : 'DEVICE'}
                    </span>
                    {expandedCategory === 'device' ? (
                      <ChevronDown className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedCategory === 'device' && (
                  <div className="p-2.5 pt-1 border-t border-slate-800/80 space-y-1.5 bg-slate-950/60">
                    {/* Foldable Split-Screen Settings */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenFoldableModal();
                      }}
                      className="w-full p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/35 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Foldable Split-Screen Settings</div>
                          <div className="text-[11px] text-slate-400">
                            Center fold gap, top/bottom or side-by-side, swap sides ({foldableConfig.isFoldableMode ? 'On' : 'Off'})
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                        SETUP
                      </span>
                    </button>

                    {/* Download / Status of Android APK */}
                    {isApk ? (
                      <div className="w-full p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-left">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Android Offline App</div>
                            <div className="text-[11px] text-emerald-400">
                              Installed and works without internet
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700">
                          INSTALLED
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenApkModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/35 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Get Android Offline App (.APK)</div>
                            <div className="text-[11px] text-slate-400">
                              Install on any phone, tablet, or foldable — works offline
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700">
                          .APK
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* About Button - Clean last item in settings list */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleOpenAbout();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-cyan-400 border border-slate-700">
                      <Info className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-cyan-200">
                        About
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Key features &amp; what this app can do
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                WORKS OFFLINE
              </span>
              <span>PRO V10</span>
            </div>
          </div>

          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center p-0">
        {deviceFrameMode === 'foldable' ? (
          /* Realistic Foldable Phone Frame (Unfolded in Portrait Mode - e.g. Galaxy Z Fold 6 / Pixel Fold 7.6"-8.0" display) */
          <div className="w-[96%] h-[98%] max-w-[860px] aspect-[1/1.22] max-h-[96vh] bg-slate-950 rounded-3xl border-8 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative ring-2 ring-slate-700/60">
            {/* Android Status Bar */}
            <div className="h-6 bg-slate-950 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none border-b border-slate-800/40 shrink-0">
              <span className="font-semibold text-slate-200">{clockTime}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>UNFOLDED PORTRAIT (7.6")</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400">5G</span>
                <BatteryMedium className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-slate-300 font-bold">96%</span>
              </div>
            </div>

            {/* Inner Content */}
            <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative">
              {children}
            </div>

            {/* Android Navigation Pill Bar at bottom */}
            <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0 border-t border-slate-900">
              <div className="w-28 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        ) : deviceFrameMode === 'tablet' ? (
          /* Android Tablet Bezel */
          <div className="w-[98%] h-[97%] max-w-[1500px] bg-slate-950 rounded-3xl border-8 border-slate-800 shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-slate-700/50">
            {/* Android Status Bar */}
            <div className="h-6 bg-slate-950 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none border-b border-slate-800/40 shrink-0">
              <span className="font-semibold text-slate-200">{clockTime}</span>
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400">5G</span>
                <BatteryMedium className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-slate-300 font-bold">98%</span>
              </div>
            </div>

            {/* Inner Content */}
            <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
              {children}
            </div>

            {/* Android Navigation Pill Bar at bottom */}
            <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
              <div className="w-32 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        ) : (
          /* Pure Full-Bleed Native App Layout */
          <div className="w-full h-full flex flex-col overflow-hidden">
            {children}
          </div>
        )}
      </div>

      {/* Landscape Bottom Options Dock Bar (replaces intrusive popup with sleek thumb-accessible bottom controls) */}
      {isLandscape && !foldableConfig.isFoldableMode && onChangeLandscapeMode && (
        <nav aria-label="Landscape Layout Options" className="bg-slate-950/95 border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-center gap-2 sm:gap-3 shrink-0 z-20 shadow-lg">
          <span className="text-[11px] font-mono text-slate-400 hidden xs:inline flex items-center gap-1 mr-1">
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>LAYOUT:</span>
          </span>
          <button
            onClick={() => onChangeLandscapeMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              landscapeMode === 'split'
                ? 'bg-cyan-600 text-white shadow-xs font-bold border border-cyan-400/80 ring-1 ring-cyan-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Split Screen: Schedule on left, Timer on right"
          >
            <Columns2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Split (50/50)</span>
          </button>
          <button
            onClick={() => onChangeLandscapeMode('stage')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              landscapeMode === 'stage'
                ? 'bg-purple-600 text-white shadow-xs font-bold border border-purple-400/80 ring-1 ring-purple-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Timer Only: Giant countdown numbers"
          >
            <Tv className="w-3.5 h-3.5 text-purple-300" />
            <span>Timer Only</span>
          </button>
          <button
            onClick={() => onChangeLandscapeMode('rundown')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              landscapeMode === 'rundown'
                ? 'bg-emerald-600 text-white shadow-xs font-bold border border-emerald-400/80 ring-1 ring-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Schedule Only: Full list view"
          >
            <ListTree className="w-3.5 h-3.5 text-emerald-300" />
            <span>Schedule</span>
          </button>
        </nav>
      )}

      {/* Mobile Portrait Bottom Navigation Dock Bar */}
      {!isLandscape && !foldableConfig.isFoldableMode && (
        <nav aria-label="Mobile Navigation" className="md:hidden bg-slate-950 border-t border-slate-800/90 px-3 py-1 flex items-center justify-around shrink-0 z-20 shadow-lg">
          <button
            onClick={() => onTabChange('rundown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rundown'
                ? 'bg-cyan-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => onTabChange('timer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timer'
                ? 'bg-cyan-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Timer</span>
          </button>
          <button
            onClick={() => onTabChange('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'split'
                ? 'bg-cyan-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-all cursor-pointer"
            title="Open Settings Menu"
          >
            <Menu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Settings</span>
          </button>
        </nav>
      )}

      {/* Foldable Mode Dock Bar */}
      {foldableConfig.isFoldableMode && (
        <nav aria-label="Foldable Layout Mode" className="bg-slate-950/95 border-t border-slate-800/90 px-2 sm:px-3 py-1.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 shrink-0 z-20 shadow-lg">
          <span className="text-[11px] font-mono text-cyan-400 hidden sm:inline-flex items-center gap-1 mr-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>FOLD VIEW:</span>
          </span>
          <button
            onClick={() => {
              onUpdateFoldableConfig?.({ viewMode: 'split' });
              onChangeLandscapeMode?.('split');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              (foldableConfig.viewMode || 'split') === 'split'
                ? 'bg-cyan-600 text-white shadow-xs font-bold border border-cyan-400/80 ring-1 ring-cyan-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Show Schedule and Timer side-by-side or top/bottom"
          >
            <Columns2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Split Screen</span>
          </button>
          <button
            onClick={() => {
              if ((foldableConfig.viewMode || 'split') !== 'split') {
                onUpdateFoldableConfig?.({ viewMode: 'split', swapHalves: !foldableConfig.swapHalves });
                onChangeLandscapeMode?.('split');
              } else {
                onSwapFoldHalves();
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 touch-manipulation border ${
              foldableConfig.swapHalves
                ? 'bg-indigo-600/90 text-white border-indigo-400/80 shadow-xs font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40'
            }`}
            title="Switch Schedule and Timer sides"
          >
            {foldableConfig.orientation === 'vertical' ? (
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-300" />
            ) : (
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-300" />
            )}
            <span>Swap Sides</span>
          </button>
          <button
            onClick={() => {
              onUpdateFoldableConfig?.({ viewMode: 'stage' });
              onChangeLandscapeMode?.('stage');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              foldableConfig.viewMode === 'stage'
                ? 'bg-purple-600 text-white shadow-xs font-bold border border-purple-400/80 ring-1 ring-purple-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Timer Only: Full screen countdown"
          >
            <Tv className="w-3.5 h-3.5 text-purple-300" />
            <span>Timer Only</span>
          </button>
          <button
            onClick={() => {
              onUpdateFoldableConfig?.({ viewMode: 'rundown' });
              onChangeLandscapeMode?.('rundown');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              foldableConfig.viewMode === 'rundown'
                ? 'bg-emerald-600 text-white shadow-xs font-bold border border-emerald-400/80 ring-1 ring-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Schedule Only: Full screen list"
          >
            <ListTree className="w-3.5 h-3.5 text-emerald-300" />
            <span>Schedule</span>
          </button>
        </nav>
      )}

      {/* Multi-Device Control Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col p-4 sm:p-5 text-slate-200 space-y-3.5 shadow-2xl overflow-y-auto overscroll-contain my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <span>Control From Multiple Devices</span>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-300">
              All devices on room <strong className="text-cyan-300 font-mono font-bold">"{sessionId}"</strong> stay in sync live. Open this link on another phone, tablet, or laptop:
            </p>

            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 shrink-0">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent text-xs font-mono text-cyan-300 focus:outline-none"
              />
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl space-y-1">
              <p className="font-semibold text-slate-200">Quick Tips:</p>
              <p>&bull; <strong>Foldable Phone:</strong> Stand half-folded with the big timer on top and list below.</p>
              <p>&bull; <strong>Stage Screen:</strong> Use Timer Only mode for large, easy-to-read countdown numbers.</p>
              <p>&bull; <strong>Team Control:</strong> Changes you make here update all connected screens right away.</p>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 active:scale-95 transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* About & Marketing Video Showcase Modal */}
      <AboutModal
        isOpen={internalAboutModalOpen}
        onClose={() => setInternalAboutModalOpen(false)}
        onOpenApkModal={onOpenApkModal}
        onOpenStageMode={onToggleStageMode}
        onOpenTemplatesModal={onOpenTemplatesModal}
        onOpenSheetModal={onOpenSheetModal}
        onOpenProfilesModal={onOpenProfilesModal}
        displayName={displayName}
      />
    </div>
  );
};
