import React, { useState, useEffect, useRef } from 'react';
import { FastForward } from 'lucide-react';

interface SplashLoadingScreenProps {
  displayName: string;
  subtitle?: string;
  durationMs?: number;
  onComplete?: () => void;
}

export const SplashLoadingScreen: React.FC<SplashLoadingScreenProps> = ({
  displayName,
  subtitle = 'BROADCAST RUNTIME • OFFLINE STUDIO SYSTEM',
  durationMs = 2500,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasFinishedRef = useRef(false);

  const handleFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsFading(true);
    setTimeout(() => {
      onCompleteRef.current?.();
    }, 150);
  };

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
      if (elapsed >= durationMs) {
        clearInterval(interval);
        handleFinish();
      }
    }, 30);

    // Hard safety timeout in case tab is backgrounded or interval is throttled
    const safetyTimeout = setTimeout(() => {
      clearInterval(interval);
      handleFinish();
    }, durationMs + 200);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, [durationMs]); // Strictly depend ONLY on durationMs to prevent restart loops

  // Status subtitle progression across the duration
  const getStatusText = () => {
    if (progress < 30) return 'INITIALIZING STUDIO ENGINE...';
    if (progress < 65) return 'LOADING OFFLINE SPREADSHEET DRIVERS...';
    if (progress < 95) return 'CALIBRATING BROADCAST TIMERS & CUES...';
    return 'STUDIO RUNTIME READY';
  };

  // Format display name: first word in white, remaining words in vibrant emerald
  const words = displayName.trim().split(' ');
  const firstWord = words[0] || "CYRIL'S";
  const restWords = words.slice(1).join(' ');

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center select-none transition-opacity duration-200 cursor-pointer ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Click anywhere to skip loading screen"
    >
      {/* Subtle Broadcast Grid & Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/25 via-black to-black pointer-events-none" />

      {/* Main Content Box */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-2xl animate-in zoom-in-95 duration-300">
        {/* On-Air Live Signal Dot & CRO Badge */}
        <div className="flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-slate-800 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
          <span className="font-mono text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
            CRO LIVE BROADCAST
          </span>
          <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
            OFFLINE READY
          </span>
        </div>

        {/* Selected Display Name */}
        <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-widest uppercase drop-shadow-2xl leading-tight">
          {firstWord}{' '}
          {restWords ? (
            <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              {restWords}
            </span>
          ) : (
            <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              RUNDOWN
            </span>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-mono text-cyan-300 mt-2 tracking-widest uppercase opacity-85">
          {subtitle}
        </p>

        {/* Animated Loading Bar */}
        <div className="w-64 sm:w-80 h-2 bg-slate-900 rounded-full mt-7 overflow-hidden border border-slate-800 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-400 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_#22d3ee]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-64 sm:w-80 mt-2 text-[10px] font-mono text-slate-400">
          <span className="tracking-wider">{getStatusText()}</span>
          <span className="font-bold text-cyan-400 font-digital">{progress}%</span>
        </div>

        {/* Skip button for instant entry */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="mt-6 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span>TAP ANYWHERE TO SKIP</span>
          <FastForward className="w-3 h-3 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
