import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RundownItem, TimerState } from '../types/rundown';
import { formatTime, getCurrentTimeOfDay, addSecondsToClockTime } from '../utils/timeFormat';
import { 
  Maximize2, 
  Minimize2, 
  AlertTriangle, 
  Clock, 
  Tv, 
  Columns2
} from 'lucide-react';

import { StageWorldClock } from './StageWorldClock';

interface TalentStageDisplayProps {
  sessionId: string;
  items: RundownItem[];
  timer: TimerState;
  plannedStartTime?: string;
  displayName?: string;
  onExitTalentMode?: () => void;
}

export const TalentStageDisplay: React.FC<TalentStageDisplayProps> = ({
  sessionId: _sessionId,
  items,
  timer,
  plannedStartTime = '19:00:00',
  displayName = "CYRIL'S RUNDOWN",
  onExitTalentMode: _onExitTalentMode
}) => {
  const [clockTime, setClockTime] = useState(getCurrentTimeOfDay());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Talent can cleanly toggle between Stage View (confidence monitor) and Split View (Rundown list + Stage monitor)
  const [talentView, setTalentView] = useState<'stage' | 'split'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'split') return 'split';
    }
    return 'stage';
  });
  
  // Ref for auto-scrolling rundown list in split view
  const rundownListRef = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Auto-scroll rundown to active segment in split view
  useEffect(() => {
    if (talentView === 'split' && timer.activeItemIndex >= 0 && rundownListRef.current[timer.activeItemIndex]) {
      rundownListRef.current[timer.activeItemIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [talentView, timer.activeItemIndex, timer.isRunning]);

  // Time of Day ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setClockTime(getCurrentTimeOfDay());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Screen Wake Lock API for talent stage confidence monitors (keeps screen awake)
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    requestWakeLock();
    return () => {
      if (wakeLockSentinel) wakeLockSentinel.release();
    };
  }, []);

  // Auto Stage View Flash States (Auto flash at 30s, 15s, and continuous from 10s down to 0s)
  const [isAutoFlashing, setIsAutoFlashing] = useState(false);
  const [autoFlashMessage, setAutoFlashMessage] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<'amber' | 'red' | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto Flash visual cues listener on countdown ticker
  useEffect(() => {
    if (!timer.isRunning) {
      setIsAutoFlashing(false);
      setAutoFlashMessage(null);
      setFlashType(null);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      return;
    }

    const nextRemaining = timer.timeRemaining;

    // 1. Continuous auto stage flash from 10 seconds down to zero
    if (nextRemaining <= 10 && nextRemaining >= 0) {
      setIsAutoFlashing(true);
      setFlashType('red');
      if (nextRemaining === 0) {
        setAutoFlashMessage("TIME'S UP • WRAP UP");
      } else {
        setAutoFlashMessage(`FINAL ${nextRemaining}s • WRAP UP NOW`);
      }
      return;
    }

    // 2. Auto stage flash at 15 seconds
    if (nextRemaining === 15) {
      setIsAutoFlashing(true);
      setFlashType('amber');
      setAutoFlashMessage("15 SECONDS LEFT • WRAP UP");

      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setIsAutoFlashing(false);
        setAutoFlashMessage(null);
        setFlashType(null);
      }, 1900);
      return;
    }

    // 3. Auto stage flash at 30 seconds
    if (nextRemaining === 30) {
      setIsAutoFlashing(true);
      setFlashType('amber');
      setAutoFlashMessage("30 SECONDS LEFT");

      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setIsAutoFlashing(false);
        setAutoFlashMessage(null);
        setFlashType(null);
      }, 1900);
      return;
    }

    // Normal running outside flash trigger points
    if (nextRemaining > 10 && nextRemaining !== 15 && nextRemaining !== 30) {
      setIsAutoFlashing(false);
      setAutoFlashMessage(null);
      setFlashType(null);
    }
  }, [timer.timeRemaining, timer.isRunning, timer.activeItemIndex]);

  const currentItem: RundownItem | undefined = items[timer.activeItemIndex];
  const nextItem1: RundownItem | undefined = items[timer.activeItemIndex + 1];
  const nextItem2: RundownItem | undefined = items[timer.activeItemIndex + 2];

  const timeRemaining = timer.timeRemaining;
  const isOvertime = timer.isOvertime || timeRemaining < 0;

  // Segment progress
  const currentDuration = timer.duration || (currentItem ? currentItem.durationSec : 180);
  const elapsedInSegment = Math.max(0, currentDuration - timeRemaining);
  const segmentProgressPct = Math.min(100, Math.max(0, (elapsedInSegment / currentDuration) * 100));

  // Cumulative planned schedule for read-only rundown
  const scheduledItems = useMemo(() => {
    let runningSeconds = 0;
    return items.map((item) => {
      const itemStart = addSecondsToClockTime(plannedStartTime, runningSeconds);
      runningSeconds += item.durationSec;
      const itemEnd = addSecondsToClockTime(plannedStartTime, runningSeconds);
      return {
        ...item,
        calculatedStart: itemStart,
        calculatedEnd: itemEnd,
      };
    });
  }, [items, plannedStartTime]);

  const totalDurationSec = useMemo(() => {
    return items.reduce((acc, item) => acc + item.durationSec, 0);
  }, [items]);

  // Color logic
  let timerColorClass = 'text-emerald-400';
  let timerBorderGlow = 'glow-emerald border-emerald-500/50 bg-emerald-950/20';

  if (isOvertime) {
    timerColorClass = 'text-rose-500 animate-overtime';
    timerBorderGlow = 'glow-rose border-rose-500/70 bg-rose-950/30';
  } else if (flashType === 'red') {
    timerColorClass = 'text-rose-400 animate-pulse';
    timerBorderGlow = 'flash-stage-red border-rose-500 bg-rose-950/35';
  } else if (flashType === 'amber') {
    timerColorClass = 'text-amber-300 animate-pulse';
    timerBorderGlow = 'flash-stage-amber border-amber-400 bg-amber-950/35';
  } else if (timeRemaining <= 15) {
    timerColorClass = 'text-rose-400';
    timerBorderGlow = 'glow-rose border-rose-500/50 bg-rose-950/25';
  } else if (timeRemaining <= 60) {
    timerColorClass = 'text-amber-400';
    timerBorderGlow = 'glow-amber border-amber-500/50 bg-amber-950/25';
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const hasActiveFlash = isAutoFlashing || timer.flashAlert;
  const isRedFlash = flashType === 'red';

  return (
    <div
      className={`fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none p-2 sm:p-4 transition-all duration-200 ${
        timer.flashAlert
          ? 'bg-amber-500 ring-16 ring-white'
          : isRedFlash
          ? 'flash-stage-red border-4 border-rose-500'
          : isAutoFlashing
          ? 'flash-stage-amber border-4 border-amber-400'
          : ''
      }`}
    >
      {/* Visual Strobe Flash Alert Banner (Auto-flash at 30s, 15s, 10s-0s, or Director Manual Alert) */}
      {hasActiveFlash && (
        <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-auto max-w-[92vw] animate-in fade-in zoom-in-95 duration-100">
          <div
            className={`px-4 sm:px-8 py-2 sm:py-3 rounded-2xl font-display font-black text-xs sm:text-lg md:text-2xl tracking-widest uppercase shadow-2xl flex items-center justify-center gap-2.5 border-3 transition-colors ${
              timer.flashAlert
                ? 'bg-amber-400 text-black border-white animate-bounce shadow-[0_0_40px_rgba(245,158,11,1)]'
                : isRedFlash
                ? 'bg-rose-600 text-white border-white animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.9)]'
                : 'bg-amber-500 text-black border-white animate-pulse shadow-[0_0_35px_rgba(245,158,11,0.9)]'
            }`}
          >
              <AlertTriangle className={`w-4 h-4 sm:w-6 sm:h-6 shrink-0 ${isRedFlash ? 'text-white' : 'text-black'}`} />
            <span className="truncate">
              ⚡ {autoFlashMessage || 'STAGE ALERT • WRAP UP NOW'} ⚡
            </span>
          </div>
        </div>
      )}

      {/* Clean Uncluttered Header Bar */}
      <header className="flex items-center justify-between pb-2 border-b border-slate-800/80 shrink-0 gap-2">
        {/* Left: Live Indicator & Display Name */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                timer.isRunning ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-600'
              }`}
            />
            <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase text-white">
              {timer.isRunning ? 'LIVE' : 'WAITING'}
            </span>
          </div>
          {displayName && (
            <span className="hidden sm:inline-block font-display font-black text-xs tracking-wider text-slate-300 uppercase px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 truncate max-w-[200px]">
              {displayName}
            </span>
          )}
        </div>

        {/* Center: Clean View Switcher (Big Timer vs Split View) */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setTalentView('stage')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              talentView === 'stage'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Full screen countdown timer"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Big Timer</span>
          </button>
          <button
            onClick={() => setTalentView('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              talentView === 'split'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Split View (Schedule List + Big Timer)"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Split View</span>
          </button>
        </div>

        {/* Right: Clock & Clean Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Clock Time */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-digital text-xs sm:text-sm font-bold text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{clockTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* VIEW 1: STAGE VIEW (Confidence Monitor) */}
      {talentView === 'stage' && (
        <div className="flex-1 flex flex-col justify-between items-center my-auto min-h-0 py-1 sm:py-2 w-full">
          {/* Current Segment Meta: Large Segment Number & Presenter */}
          <div className="text-center w-full max-w-5xl px-2 shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-slate-900/90 border-2 border-cyan-400/70 shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                <span className="text-white font-mono font-black text-sm sm:text-2xl md:text-3xl tracking-wider">
                  ITEM {currentItem ? currentItem.segmentNumber : '01'}
                </span>
              </div>

              {currentItem?.presenter && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-amber-950/80 border-2 border-amber-500/70 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-300 font-display font-extrabold text-xs sm:text-lg md:text-2xl tracking-wide truncate max-w-xs sm:max-w-md">
                    {currentItem.presenter}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-display font-black tracking-tight text-white line-clamp-2">
              {currentItem?.title || 'No Active Item'}
            </h1>
          </div>

          {/* Giant Countdown Frame with Direct World Clock */}
          <div className="w-full max-w-4xl px-2 my-auto">
            <div
              className={`w-full py-3 sm:py-6 px-4 sm:px-8 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${timerBorderGlow}`}
            >
              <StageWorldClock className="mb-2 sm:mb-4" />

              {isOvertime && (
                <div className="flex items-center gap-2 text-rose-400 text-xs sm:text-base font-bold font-mono tracking-widest uppercase mb-1 animate-pulse">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>OVERTIME</span>
                </div>
              )}

              <div
                className={`font-digital font-black tracking-tight text-center leading-none transition-colors duration-200 select-none ${timerColorClass} text-6xl sm:text-7xl md:text-8xl lg:text-9xl`}
              >
                {formatTime(timeRemaining)}
              </div>

              <div className="w-full max-w-lg bg-slate-900/90 h-2.5 sm:h-3 rounded-full mt-3 sm:mt-5 overflow-hidden border border-slate-800">
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

              <div className="flex items-center justify-between w-full max-w-lg mt-1.5 text-[11px] sm:text-xs font-mono text-slate-400">
                <span>TIME PASSED: {formatTime(elapsedInSegment)}</span>
                <span>LENGTH: {formatTime(currentDuration)}</span>
              </div>
            </div>
          </div>

          {/* Essential Notes Area */}
          {(currentItem?.notes || currentItem?.audioNotes) && (
            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 shrink-0 px-2">
              {currentItem?.notes && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md flex items-start gap-2.5">
                  <span className="text-lg">🎬</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      NOTES &amp; CUES
                    </span>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-100 leading-snug mt-0.5 break-words">
                      {currentItem.notes}
                    </p>
                  </div>
                </div>
              )}

              {currentItem?.audioNotes && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md flex items-start gap-2.5">
                  <span className="text-lg">🔊</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      SOUND &amp; MIC NOTE
                    </span>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-100 leading-snug mt-0.5 break-words">
                      {currentItem.audioNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next TWO Items at Bottom */}
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0 pt-2 px-2">
            {/* Next Item 1: UP NEXT */}
            <div className="bg-slate-900/95 border border-amber-500/50 rounded-xl px-3 py-2 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-mono font-black uppercase tracking-wider shrink-0">
                  UP NEXT
                </span>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <span className="font-mono text-cyan-400">#{nextItem1 ? nextItem1.segmentNumber : '--'}</span>
                    <span className="truncate">{nextItem1 ? nextItem1.title : 'End of Schedule'}</span>
                  </div>
                  {nextItem1?.presenter && (
                    <div className="text-[10px] text-amber-300 font-semibold truncate">
                      {nextItem1.presenter}
                    </div>
                  )}
                </div>
              </div>

              {nextItem1 && (
                <div className="font-digital text-xs sm:text-sm font-bold text-amber-300 ml-2 shrink-0">
                  {formatTime(nextItem1.durationSec)}
                </div>
              )}
            </div>

            {/* Next Item 2: AFTER THAT */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
                  AFTER THAT
                </span>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <span className="font-mono text-cyan-400">#{nextItem2 ? nextItem2.segmentNumber : '--'}</span>
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
                <div className="font-digital text-xs sm:text-sm font-bold text-slate-400 ml-2 shrink-0">
                  {formatTime(nextItem2.durationSec)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SPLIT VIEW (Clean Read-Only Rundown + Confidence Monitor) */}
      {talentView === 'split' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 gap-2 sm:gap-3 py-1">
          {/* Left/Top Half: Clean Read-Only Rundown List (No edit/arrange controls) */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl">
            {/* Read-Only Header */}
            <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-white uppercase tracking-wide">
                  Show Schedule
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.2 rounded border border-cyan-800">
                  VIEW ONLY
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {items.length} Items &bull; {formatTime(totalDurationSec, true)}
              </div>
            </div>

            {/* Read-Only Item List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
              {scheduledItems.map((item, index) => {
                const isActive = index === timer.activeItemIndex;
                const isLive = isActive && timer.isRunning;
                const isCue = index === timer.activeItemIndex + 1 || item.status === 'cue';
                const isDone = item.status === 'done';

                return (
                  <div
                    key={item.id}
                    ref={(el) => { rundownListRef.current[index] = el; }}
                    className={`p-2.5 rounded-xl border-l-4 transition-all ${
                      isLive
                        ? 'bg-emerald-950/60 border-l-emerald-500 shadow-sm ring-1 ring-emerald-500/50'
                        : isActive
                        ? 'bg-slate-800/90 border-l-cyan-400'
                        : isCue
                        ? 'bg-slate-900/80 border-l-amber-500/80'
                        : isDone
                        ? 'bg-slate-950/50 border-l-slate-700 opacity-60'
                        : 'bg-slate-900/60 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Item Number & Status */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <span className="w-6 h-6 rounded bg-slate-800 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
                          {item.segmentNumber}
                        </span>
                        {isLive ? (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-emerald-500 text-black animate-pulse">
                            LIVE
                          </span>
                        ) : isCue ? (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-500 text-black">
                            NEXT
                          </span>
                        ) : isDone ? (
                          <span className="px-1 py-0.2 rounded text-[8px] font-medium uppercase bg-slate-800 text-slate-400">
                            DONE
                          </span>
                        ) : null}
                      </div>

                      {/* Content: Title & Notes */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-bold leading-snug break-words ${
                              isLive
                                ? 'text-emerald-300'
                                : isDone
                                ? 'text-slate-400 line-through'
                                : 'text-white'
                            }`}
                          >
                            {item.title}
                          </h4>
                          {/* Duration Display (View Only) */}
                          <span className="font-digital text-xs font-bold text-slate-300 shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {formatTime(item.durationSec)}
                          </span>
                        </div>

                        {/* Speaker Name */}
                        {item.presenter && (
                          <div className="text-[10px] text-amber-300 font-semibold mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span>{item.presenter}</span>
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <div className="text-[11px] text-amber-200/90 font-medium leading-relaxed mt-1 p-1.5 rounded-lg bg-amber-950/30 border border-amber-800/40 break-words">
                            📝 {item.notes}
                          </div>
                        )}

                        {/* Sound Note */}
                        {item.audioNotes && (
                          <div className="text-[11px] text-slate-200 font-medium leading-relaxed mt-1 p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 break-words">
                            🔊 {item.audioNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right/Bottom Half: Clean Big Timer View */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-between bg-black rounded-2xl border border-slate-800/90 p-3 sm:p-5 overflow-hidden shadow-xl">
            {/* Header: Item Title & Speaker */}
            <div className="text-center shrink-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800">
                  ITEM {currentItem ? currentItem.segmentNumber : '01'}
                </span>
                {currentItem?.presenter && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold text-xs border border-amber-800">
                    {currentItem.presenter}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-display font-black text-white truncate">
                {currentItem?.title || 'No Active Item'}
              </h2>
            </div>

            {/* Giant Digits with Direct World Clock */}
            <div className="flex flex-col items-center justify-center my-auto w-full">
              <StageWorldClock compact onlyClock className="mb-2" />

              {isOvertime && (
                <div className="flex items-center gap-1 text-rose-400 text-xs font-bold font-mono tracking-widest uppercase mb-0.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>OVERTIME</span>
                </div>
              )}
              <div
                className={`font-digital font-black tracking-tight text-center leading-none ${timerColorClass} text-5xl sm:text-6xl md:text-7xl`}
              >
                {formatTime(timeRemaining)}
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-sm bg-slate-900 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOvertime ? 'bg-rose-500' : timeRemaining <= 15 ? 'bg-rose-500' : timeRemaining <= 60 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${segmentProgressPct}%` }}
                />
              </div>
            </div>

            {/* Bottom Up Next Preview */}
            <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-mono font-bold uppercase shrink-0">
                  UP NEXT
                </span>
                <span className="font-bold text-white truncate">
                  #{nextItem1 ? nextItem1.segmentNumber : '--'} {nextItem1 ? nextItem1.title : 'End of Schedule'}
                </span>
              </div>
              {nextItem1 && (
                <span className="font-digital text-amber-300 font-bold ml-2 shrink-0">
                  {formatTime(nextItem1.durationSec)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
