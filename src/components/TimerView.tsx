import React, { useEffect, useState } from 'react';
import { RundownItem, TimerState } from '../types/rundown';
import { formatTime, getCurrentTimeOfDay } from '../utils/timeFormat';
import { WorldClock } from './WorldClock';
import { StageWorldClock } from './StageWorldClock';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Maximize2,
  Minimize2,
  Zap,
  Clock,
  Radio,
  AlertTriangle,
  Globe2
} from 'lucide-react';

interface TimerViewProps {
  timer: TimerState;
  items: RundownItem[];
  isStageMode?: boolean;
  isFoldableSplit?: boolean;
  isSplitMode?: boolean;
  onToggleStageMode?: () => void;
  onTimerAction: (action: 'start' | 'pause' | 'reset' | 'next' | 'prev' | 'flash') => void;
  onAdjustTimer: (deltaSeconds: number) => void;
  onToggleAutoAdvance: () => void;
  showPlannedStartTime: string;
}

export const TimerView: React.FC<TimerViewProps> = ({
  timer,
  items,
  isStageMode = false,
  isFoldableSplit = false,
  isSplitMode = false,
  onToggleStageMode,
  onTimerAction,
  onAdjustTimer,
  onToggleAutoAdvance,
  showPlannedStartTime: _showPlannedStartTime
}) => {
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState(getCurrentTimeOfDay());
  const [showWorldClockInStandard, setShowWorldClockInStandard] = useState(false);

  // Keep live Time of Day clock running every second
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentTimeOfDay(getCurrentTimeOfDay());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const currentItem: RundownItem | undefined = items[timer.activeItemIndex];
  const nextItem1: RundownItem | undefined = items[timer.activeItemIndex + 1];
  const nextItem2: RundownItem | undefined = items[timer.activeItemIndex + 2];
  const nextItem = nextItem1;

  const timeRemaining = timer.timeRemaining;
  const isOvertime = timer.isOvertime || timeRemaining < 0;

  // Calculate segment progress percentage (0 to 100)
  const currentDuration = timer.duration || (currentItem ? currentItem.durationSec : 180);
  const elapsedInSegment = Math.max(0, currentDuration - timeRemaining);
  const segmentProgressPct = Math.min(100, Math.max(0, (elapsedInSegment / currentDuration) * 100));

  // Calculate overall show elapsed and remaining
  const totalShowDuration = items.reduce((sum, item) => sum + item.durationSec, 0);
  const completedDuration = items
    .slice(0, timer.activeItemIndex)
    .reduce((sum, item) => sum + item.durationSec, 0);
  const totalShowElapsed = completedDuration + elapsedInSegment;
  const totalShowRemaining = Math.max(0, totalShowDuration - totalShowElapsed);

  // Color logic for timer
  let timerColorClass = 'text-emerald-400';
  let timerBorderGlow = 'glow-emerald border-emerald-500/40 bg-emerald-950/20';

  if (isOvertime) {
    timerColorClass = 'text-rose-500 animate-overtime';
    timerBorderGlow = 'glow-rose border-rose-500/60 bg-rose-950/30';
  } else if (timeRemaining <= 15) {
    timerColorClass = 'text-rose-400';
    timerBorderGlow = 'glow-rose border-rose-500/40 bg-rose-950/20';
  } else if (timeRemaining <= 60) {
    timerColorClass = 'text-amber-400';
    timerBorderGlow = 'glow-amber border-amber-500/40 bg-amber-950/20';
  }

  // =========================================================================
  // FOLDABLE PORTRAIT SPLIT VIEW LAYOUT
  // =========================================================================
  if (isFoldableSplit) {
    return (
      <div
        className={`relative flex flex-col h-full w-full bg-slate-950 text-white overflow-hidden select-none p-2 sm:p-2.5 transition-all duration-300 ${
          timer.flashAlert ? 'bg-rose-900/60 ring-4 ring-rose-500' : ''
        }`}
      >
        {/* Visual Flash Alert overlay when triggered */}
        {timer.flashAlert && (
          <div className="absolute inset-0 bg-rose-600/30 backdrop-blur-xs pointer-events-none z-50 animate-ping" />
        )}

        {/* Compact Header for Foldable Half */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 shrink-0">
              ITEM {currentItem ? currentItem.segmentNumber : '01'}
            </span>
            <span className="font-semibold text-slate-200 truncate text-xs sm:text-sm">
              {currentItem?.title || 'No item selected'}
            </span>
            {currentItem?.presenter && (
              <span className="hidden sm:inline text-slate-400 text-[11px] truncate">
                • {currentItem.presenter}
              </span>
            )}
          </div>

          {/* Split View Header Controls: Fullscreen, Flash, and Auto Next buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {/* Fullscreen Toggle */}
            {onToggleStageMode && (
              <button
                onClick={onToggleStageMode}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer active:scale-95"
                title={isStageMode ? 'Exit Big Timer View' : 'Open Big Timer View'}
              >
                {isStageMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Flash Alert Button */}
            <button
              onClick={() => onTimerAction('flash')}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded text-[10px] font-semibold cursor-pointer active:scale-95"
              title="Flash screen to signal speaker"
            >
              <Zap className="w-3 h-3" />
              <span>FLASH</span>
            </button>

            {/* Auto-Next Toggle (30% larger touch target) */}
            <button
              onClick={onToggleAutoAdvance}
              className={`px-2.5 py-1.5 rounded-lg text-[13px] font-mono font-bold tracking-tight border transition-colors cursor-pointer active:scale-95 shrink-0 ${
                timer.autoAdvance
                  ? 'bg-cyan-950 border-cyan-500/70 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically start next item when timer hits zero"
            >
              AUTO NEXT: {timer.autoAdvance ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Middle Two-Column Grid: Left = Timer & Notes, Right = Broadcast World Clock */}
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 my-1.5 overflow-hidden">
          {/* Left Column: Countdown Frame */}
          <div
            className={`flex flex-col justify-between p-2 rounded-xl border-2 h-full transition-all duration-300 overflow-hidden ${timerBorderGlow}`}
          >
            {/* Top Info / Overtime Alert */}
            <div className="flex items-center justify-between text-[10px] font-mono shrink-0">
              {isOvertime ? (
                <div className="flex items-center gap-1 text-rose-400 font-bold tracking-widest uppercase animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span>OVERTIME</span>
                </div>
              ) : (
                <span className="text-slate-400 uppercase font-semibold">TIME LEFT</span>
              )}
              <span className="text-slate-400">LENGTH: {formatTime(currentDuration)}</span>
            </div>

            {/* World Clock next to/inside timer: increased size by 30%, no scale down */}
            <StageWorldClock compact onlyClock className="my-1" />

            {/* Countdown Digits (reduced size for optimal viewport balance) */}
            <div
              className={`font-digital font-black tracking-tight text-center leading-none transition-colors duration-200 my-auto text-3xl sm:text-4xl ${timerColorClass}`}
            >
              {formatTime(timeRemaining)}
            </div>

            {/* Segment Progress Bar */}
            <div className="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden border border-slate-800 shrink-0 my-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOvertime
                    ? 'bg-rose-500'
                    : timeRemaining <= 15
                    ? 'bg-rose-500'
                    : timeRemaining <= 60
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${segmentProgressPct}%` }}
              />
            </div>

            {/* Basic Notes & Audio Note (only shown when present) */}
            {(currentItem?.notes || currentItem?.audioNotes) && (
              <div className="mt-1 space-y-1 shrink-0">
                {currentItem?.notes && (
                  <div className="px-2 py-1 rounded-lg bg-amber-950/35 border border-amber-800/40 text-xs text-amber-100 leading-snug break-words flex items-start gap-1.5">
                    <span className="shrink-0">🎬</span>
                    <span className="flex-1">{currentItem.notes}</span>
                  </div>
                )}
                {currentItem?.audioNotes && (
                  <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700/70 text-xs text-slate-200 leading-snug break-words flex items-start gap-1.5">
                    <span className="shrink-0">🔊</span>
                    <span className="flex-1">{currentItem.audioNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: World Clock (Only clocks, no other info) */}
          <div className="h-full overflow-hidden">
            <WorldClock compact={true} onlyClocks={true} />
          </div>
        </div>

        {/* Compact Single-Row Broadcast Controls for Foldable View */}
        <div className="pt-1.5 border-t border-slate-800 shrink-0">
          <div className="grid grid-cols-6 gap-1.5">
            {/* Prev Item */}
            <button
              onClick={() => onTimerAction('prev')}
              disabled={timer.activeItemIndex === 0}
              className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              title="Previous Item"
            >
              <SkipBack className="w-3 h-3" />
              <span className="hidden sm:inline">PREV</span>
            </button>

            {/* PLAY / PAUSE button */}
            <button
              onClick={() => onTimerAction(timer.isRunning ? 'pause' : 'start')}
              className={`col-span-2 py-1 px-2 rounded-lg font-display font-extrabold text-[11px] sm:text-xs tracking-wider flex items-center justify-center gap-1 cursor-pointer active:scale-98 shadow-sm transition-all ${
                timer.isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-black glow-amber'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black glow-emerald'
              }`}
              title={timer.isRunning ? 'Pause Timer' : 'Start Timer'}
            >
              {timer.isRunning ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>START</span>
                </>
              )}
            </button>

            {/* Next Item */}
            <button
              onClick={() => onTimerAction('next')}
              disabled={timer.activeItemIndex >= items.length - 1}
              className="py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
              title="Next Item"
            >
              <span className="hidden sm:inline">NEXT</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Quick Adjust -30s */}
            <button
              onClick={() => onAdjustTimer(-30)}
              className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-medium border border-slate-700 cursor-pointer active:scale-95 text-center"
              title="Take away 30 seconds"
            >
              -30s
            </button>

            {/* Reset */}
            <button
              onClick={() => onTimerAction('reset')}
              className="py-1.5 px-1 bg-slate-800 hover:bg-rose-950/80 hover:border-rose-700 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer active:scale-95 flex items-center justify-center gap-1"
              title="Restart this item"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD VIEW LAYOUT (Full Screen, Tablet, or Split Mode)
  // Audio cues moved directly into the timer container to save precious screen space!
  // World Clock takes the freed space or can be displayed side-by-side / toggled!
  // =========================================================================
  return (
    <div
      className={`relative flex flex-col h-full bg-slate-950 text-white overflow-hidden select-none transition-all duration-300 ${
        timer.flashAlert ? 'bg-rose-900/60 ring-8 ring-rose-500' : ''
      }`}
    >
      {/* Visual Flash Alert overlay when triggered */}
      {timer.flashAlert && (
        <div className="absolute inset-0 bg-rose-600/30 backdrop-blur-xs pointer-events-none z-50 animate-ping" />
      )}

      {/* Top Header Bar */}
      <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Radio
              className={`w-3.5 h-3.5 shrink-0 ${timer.isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}
            />
            <span className="font-display font-bold text-xs sm:text-sm tracking-wide text-slate-200 truncate">
              {timer.isRunning ? 'LIVE' : 'PAUSED'}
            </span>
            {isSplitMode && (
              <>
                <span className="text-slate-500 text-xs">•</span>
                <span className="font-mono text-[11px] sm:text-xs text-cyan-400 font-semibold truncate">
                  ITEM {currentItem ? currentItem.segmentNumber : '01'}
                </span>
              </>
            )}
          </div>
          {!isSplitMode && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-cyan-300 shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLOCK: {currentTimeOfDay}</span>
            </div>
          )}
        </div>

        {/* Top Controls: When isSplitMode is true, ONLY leave Full Screen, Flash, and Auto Next buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {!isSplitMode && (
            <button
              onClick={() => setShowWorldClockInStandard(!showWorldClockInStandard)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] sm:text-xs font-mono font-medium border transition-colors cursor-pointer ${
                showWorldClockInStandard
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Show or hide World Clocks"
            >
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline sm:inline">WORLD</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          {onToggleStageMode && (
            <button
              onClick={onToggleStageMode}
              className="p-1 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 cursor-pointer active:scale-95"
              title={isStageMode ? 'Exit Big Timer View' : 'Open Big Timer View'}
            >
              {isStageMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Flash Alert Button */}
          <button
            onClick={() => onTimerAction('flash')}
            className="flex items-center gap-1 px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded text-[11px] sm:text-xs font-semibold cursor-pointer active:scale-95"
            title="Flash the stage screen to alert the speaker"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">FLASH</span>
          </button>

          {/* Auto-Next Toggle (30% larger touch target) */}
          <button
            onClick={onToggleAutoAdvance}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[13px] sm:text-[15px] font-mono font-bold border transition-colors cursor-pointer active:scale-95 shrink-0 ${
              timer.autoAdvance
                ? 'bg-cyan-950 border-cyan-500/70 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Automatically start next item when timer hits zero"
          >
            <span>AUTO NEXT: {timer.autoAdvance ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between px-3 sm:px-4 py-2 min-h-0 overflow-y-auto">
        {/* Active Item Banner */}
        <div className="w-full max-w-2xl mx-auto text-center shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border text-xs font-mono tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-300">ITEM {currentItem ? currentItem.segmentNumber : '01'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 font-semibold truncate max-w-xs">
              {currentItem?.presenter || 'Everyone'}
            </span>
          </div>

          <h1 className="text-lg sm:text-2xl font-display font-bold tracking-tight text-white truncate px-2">
            {currentItem?.title || 'No item selected'}
          </h1>

          {currentItem?.notes && (
            <div className="text-sm sm:text-base text-amber-200/90 font-medium bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-800/40 mt-1.5 max-w-xl mx-auto break-words shadow-sm flex items-start justify-center gap-1.5">
              <span className="text-amber-400 shrink-0 text-base">🎬</span>
              <span className="leading-snug">{currentItem.notes}</span>
            </div>
          )}
          {currentItem?.audioNotes && (
            <div className="text-sm sm:text-base text-slate-200 font-medium bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/70 mt-1 max-w-xl mx-auto break-words shadow-sm flex items-start justify-center gap-1.5">
              <span className="shrink-0 text-base">🔊</span>
              <span className="leading-snug">{currentItem.audioNotes}</span>
            </div>
          )}
        </div>

        {/* Dynamic Center Stage: Countdown OR Split with World Clock */}
        <div className={`w-full max-w-4xl mx-auto my-auto grid gap-3 ${
          showWorldClockInStandard ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-2xl'
        }`}>
          {/* Main Giant Countdown Frame & Direct World Clock */}
          <div
            className={`w-full py-2.5 sm:py-4 px-4 sm:px-6 rounded-2xl border-2 flex flex-col items-center justify-between transition-all duration-300 ${timerBorderGlow}`}
          >
            {/* Broadcast World Clock: When isSplitMode is true, only show clock digits */}
            <StageWorldClock compact={!isStageMode} onlyClock={isSplitMode} className="mb-2" />

            {isOvertime && (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs sm:text-sm font-bold font-mono tracking-widest uppercase mb-1 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span>OVERTIME</span>
              </div>
            )}

            {/* Countdown Digits (reduced size for better proportional balance across screens) */}
            <div
              className={`font-digital font-black tracking-tight text-center leading-none transition-colors duration-200 my-auto ${timerColorClass} ${
                isStageMode
                  ? 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl'
                  : showWorldClockInStandard
                  ? 'text-4xl sm:text-5xl lg:text-6xl'
                  : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>

            {/* Segment Progress Bar */}
            <div className="w-full max-w-md bg-slate-900/90 h-2 rounded-full mt-2 overflow-hidden border border-slate-800 shrink-0">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOvertime
                    ? 'bg-rose-500'
                    : timeRemaining <= 15
                    ? 'bg-rose-500'
                    : timeRemaining <= 60
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${segmentProgressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full max-w-md mt-1 text-[11px] font-mono text-slate-400 shrink-0">
              <span>TIME PASSED: {formatTime(elapsedInSegment)}</span>
              <span>LENGTH: {formatTime(currentDuration)}</span>
            </div>
          </div>

          {/* World Clock Column when toggled */}
          {showWorldClockInStandard && (
            <div className="w-full h-full min-h-[220px]">
              <WorldClock compact={false} />
            </div>
          )}
        </div>

        {/* Next TWO Items at Bottom */}
        <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 shrink-0">
          {/* Up Next 1 */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono font-black uppercase shrink-0">
                UP NEXT
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1">
                  <span className="font-mono text-cyan-400 text-[10px]">#{nextItem1?.segmentNumber || '--'}</span>
                  <span className="truncate">{nextItem1 ? nextItem1.title : 'End of Schedule'}</span>
                </div>
                {nextItem1?.presenter && (
                  <div className="text-[10px] text-amber-300 truncate font-semibold">
                    {nextItem1.presenter}
                  </div>
                )}
              </div>
            </div>
            {nextItem1 && (
              <div className="text-right shrink-0 font-digital text-xs font-bold text-amber-300 ml-1.5">
                {formatTime(nextItem1.durationSec)}
              </div>
            )}
          </div>

          {/* After That 2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono font-bold uppercase shrink-0">
                AFTER THAT
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-300 truncate flex items-center gap-1">
                  <span className="font-mono text-cyan-400 text-[10px]">#{nextItem2?.segmentNumber || '--'}</span>
                  <span className="truncate">{nextItem2 ? nextItem2.title : 'All Done'}</span>
                </div>
                {nextItem2?.presenter && (
                  <div className="text-[10px] text-slate-400 truncate">
                    {nextItem2.presenter}
                  </div>
                )}
              </div>
            </div>
            {nextItem2 && (
              <div className="text-right shrink-0 font-digital text-xs font-bold text-slate-400 ml-1.5">
                {formatTime(nextItem2.durationSec)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Touch-Friendly Broadcast Controls (Reduced size by 40% for optimal layout) */}
      <div className="px-3 py-1.5 sm:py-2 bg-slate-900/90 border-t border-slate-800 shrink-0">
        <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
          {/* Primary Action Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* Prev Item */}
            <button
              onClick={() => onTimerAction('prev')}
              disabled={timer.activeItemIndex === 0}
              className="flex flex-col items-center justify-center p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700 font-semibold text-[11px] sm:text-xs transition-transform active:scale-95 cursor-pointer"
              title="Previous Item (Key: P)"
            >
              <SkipBack className="w-3.5 h-3.5 mb-0.5" />
              <span>PREV</span>
            </button>

            {/* Compact PLAY / PAUSE button */}
            <button
              onClick={() => onTimerAction(timer.isRunning ? 'pause' : 'start')}
              className={`col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl font-display font-extrabold text-xs sm:text-sm tracking-wider transition-all transform active:scale-98 cursor-pointer shadow-md ${
                timer.isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-black glow-amber'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black glow-emerald'
              }`}
              title={timer.isRunning ? 'Pause Timer (Spacebar)' : 'Start Timer (Spacebar)'}
            >
              {timer.isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START</span>
                </>
              )}
            </button>

            {/* Next Item */}
            <button
              onClick={() => onTimerAction('next')}
              disabled={timer.activeItemIndex >= items.length - 1}
              className="flex flex-col items-center justify-center p-1.5 sm:p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-white rounded-xl font-semibold text-[11px] sm:text-xs transition-transform active:scale-95 cursor-pointer shadow-sm"
              title="Go to Next Item (Key: N)"
            >
              <SkipForward className="w-3.5 h-3.5 mb-0.5" />
              <span>NEXT</span>
            </button>
          </div>

          {/* Quick Timing Adjustments */}
          <div className="flex items-center justify-between gap-1 sm:gap-1.5">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-1">
              <button
                onClick={() => onAdjustTimer(-60)}
                className="flex-1 py-1 px-1 sm:px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] sm:text-xs font-mono font-medium border border-slate-700 cursor-pointer active:scale-95 text-center"
                title="Take away 1 minute"
              >
                -1m
              </button>
              <button
                onClick={() => onAdjustTimer(-30)}
                className="flex-1 py-1 px-1 sm:px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] sm:text-xs font-mono font-medium border border-slate-700 cursor-pointer active:scale-95 text-center"
                title="Take away 30 seconds"
              >
                -30s
              </button>
              <button
                onClick={() => onAdjustTimer(30)}
                className="flex-1 py-1 px-1 sm:px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] sm:text-xs font-mono font-medium border border-slate-700 cursor-pointer active:scale-95 text-center"
                title="Add 30 seconds"
              >
                +30s
              </button>
              <button
                onClick={() => onAdjustTimer(60)}
                className="flex-1 py-1 px-1 sm:px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] sm:text-xs font-mono font-medium border border-slate-700 cursor-pointer active:scale-95 text-center"
                title="Add 1 minute"
              >
                +1m
              </button>
            </div>

            <button
              onClick={() => onTimerAction('reset')}
              className="flex items-center gap-1 py-1 px-2 sm:px-3 bg-slate-800 hover:bg-rose-950/80 hover:border-rose-700 text-slate-300 hover:text-rose-300 rounded text-[10px] sm:text-xs font-medium border border-slate-700 cursor-pointer active:scale-95 transition-colors shrink-0"
              title="Restart this item (Key: R)"
            >
              <RotateCcw className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Show Timing Overview Bar */}
      <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono shrink-0 gap-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <span>
            SHOW PASSED: <strong className="text-white">{formatTime(totalShowElapsed, true)}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            SHOW LEFT: <strong className="text-cyan-300">{formatTime(totalShowRemaining, true)}</strong>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px]">
          <span className="text-slate-500">Space: Start/Pause | N: Next | P: Prev | R: Reset</span>
        </div>
      </div>

    </div>
  );
};
