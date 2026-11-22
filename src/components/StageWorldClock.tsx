import React, { useState, useEffect } from 'react';
import { Globe2, Settings2, Clock, Check, RotateCcw, X, ChevronDown } from 'lucide-react';

export interface StageWorldClockConfig {
  cityId: string;
  cityName: string;
  timezone: string;
  label: string;
  country: string;
  is24Hour: boolean;
  showSeconds: boolean;
  showDate: boolean;
}

export const PRESET_STAGE_CITIES: Array<{
  id: string;
  name: string;
  timezone: string;
  country: string;
  label: string;
}> = [
  { id: 'nairobi', name: 'Nairobi', timezone: 'Africa/Nairobi', country: 'Kenya', label: 'EAT (UTC+3)' },
  { id: 'utc', name: 'UTC / GMT', timezone: 'UTC', country: 'World Standard', label: 'UTC+0' },
  { id: 'london', name: 'London', timezone: 'Europe/London', country: 'United Kingdom', label: 'LON (GMT/BST)' },
  { id: 'new_york', name: 'New York', timezone: 'America/New_York', country: 'USA (Eastern)', label: 'NYC (EST/EDT)' },
  { id: 'los_angeles', name: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA (Pacific)', label: 'LAX (PST/PDT)' },
  { id: 'johannesburg', name: 'Johannesburg', timezone: 'Africa/Johannesburg', country: 'South Africa', label: 'SAST (UTC+2)' },
  { id: 'cairo', name: 'Cairo', timezone: 'Africa/Cairo', country: 'Egypt', label: 'EET (UTC+2)' },
  { id: 'lagos', name: 'Lagos', timezone: 'Africa/Lagos', country: 'Nigeria', label: 'WAT (UTC+1)' },
  { id: 'paris', name: 'Paris', timezone: 'Europe/Paris', country: 'France', label: 'PAR (CET/CEST)' },
  { id: 'dubai', name: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE', label: 'DXB (GST / UTC+4)' },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan', label: 'TYO (JST / UTC+9)' },
  { id: 'singapore', name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore', label: 'SGP (SGT / UTC+8)' },
  { id: 'sydney', name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia', label: 'SYD (AEST / UTC+10)' }
];

export const DEFAULT_STAGE_CLOCK: StageWorldClockConfig = {
  cityId: 'nairobi',
  cityName: 'Nairobi',
  timezone: 'Africa/Nairobi',
  label: 'EAT (UTC+3)',
  country: 'Kenya',
  is24Hour: true,
  showSeconds: true,
  showDate: true
};

const STORAGE_KEY = 'cyril_ro_stage_world_clock';
const SYNC_EVENT = 'cyril_ro_stage_clock_update';

export function getStageClockConfig(): StageWorldClockConfig {
  if (typeof window === 'undefined') return DEFAULT_STAGE_CLOCK;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STAGE_CLOCK;
    const parsed = JSON.parse(raw);
    return {
      cityId: parsed.cityId || DEFAULT_STAGE_CLOCK.cityId,
      cityName: parsed.cityName || DEFAULT_STAGE_CLOCK.cityName,
      timezone: parsed.timezone || DEFAULT_STAGE_CLOCK.timezone,
      label: parsed.label || DEFAULT_STAGE_CLOCK.label,
      country: parsed.country || DEFAULT_STAGE_CLOCK.country,
      is24Hour: parsed.is24Hour !== undefined ? parsed.is24Hour : true,
      showSeconds: parsed.showSeconds !== undefined ? parsed.showSeconds : true,
      showDate: parsed.showDate !== undefined ? parsed.showDate : true
    };
  } catch {
    return DEFAULT_STAGE_CLOCK;
  }
}

export function saveStageClockConfig(config: StageWorldClockConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: config }));
  } catch {}
}

interface StageWorldClockProps {
  compact?: boolean;
  onlyClock?: boolean;
  className?: string;
}

export const StageWorldClock: React.FC<StageWorldClockProps> = ({
  compact = false,
  onlyClock = false,
  className = ''
}) => {
  const [config, setConfig] = useState<StageWorldClockConfig>(getStageClockConfig);
  const [now, setNow] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customTzInput, setCustomTzInput] = useState('');
  const [customTzError, setCustomTzError] = useState('');

  // Ticking time effect
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync state with other components when settings change
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getStageClockConfig());
      }
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const formattedTime = () => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: config.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: config.showSeconds ? '2-digit' : undefined,
        hour12: !config.is24Hour
      };
      return new Intl.DateTimeFormat('en-GB', options).format(now);
    } catch {
      return '--:--:--';
    }
  };

  const formattedDate = () => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: config.timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      };
      return new Intl.DateTimeFormat('en-US', options).format(now);
    } catch {
      return '';
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_STAGE_CITIES[0]) => {
    const updated: StageWorldClockConfig = {
      ...config,
      cityId: preset.id,
      cityName: preset.name,
      timezone: preset.timezone,
      label: preset.label,
      country: preset.country
    };
    setConfig(updated);
    saveStageClockConfig(updated);
  };

  const handleApplyCustomTimezone = () => {
    const trimmed = customTzInput.trim();
    if (!trimmed) return;
    try {
      // Test if timezone is valid
      new Intl.DateTimeFormat('en-US', { timeZone: trimmed }).format(new Date());
      const cityName = trimmed.split('/').pop()?.replace(/_/g, ' ') || trimmed;
      const updated: StageWorldClockConfig = {
        ...config,
        cityId: 'custom',
        cityName: cityName,
        timezone: trimmed,
        label: trimmed,
        country: 'Custom'
      };
      setConfig(updated);
      saveStageClockConfig(updated);
      setCustomTzInput('');
      setCustomTzError('');
    } catch (err) {
      setCustomTzError('Timezone not recognized (try Africa/Nairobi or Europe/London)');
    }
  };

  const handleResetToNairobi = () => {
    setConfig(DEFAULT_STAGE_CLOCK);
    saveStageClockConfig(DEFAULT_STAGE_CLOCK);
    setCustomTzError('');
  };

  const handleToggle24Hour = () => {
    const updated = { ...config, is24Hour: !config.is24Hour };
    setConfig(updated);
    saveStageClockConfig(updated);
  };

  const handleToggleSeconds = () => {
    const updated = { ...config, showSeconds: !config.showSeconds };
    setConfig(updated);
    saveStageClockConfig(updated);
  };

  const handleToggleDate = () => {
    const updated = { ...config, showDate: !config.showDate };
    setConfig(updated);
    saveStageClockConfig(updated);
  };

  return (
    <>
      {onlyClock ? (
        /* Only Clock view - increased by 30% for crystal-clear readability */
        <div
          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 mb-2 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all ${className}`}
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/70 border border-cyan-500/40 shadow-inner">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <span className="font-digital font-bold text-lg sm:text-xl md:text-2xl tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
              {formattedTime()}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Edit Clock Settings"
            aria-label="Clock Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Broadcast World Clock Header Strip: increased clock size by 30% */
        <div
          className={`w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 mb-2 sm:mb-3 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all ${
            compact ? 'max-w-md' : 'max-w-xl'
          } ${className}`}
        >
          {/* Left: Location & Status */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0 shadow-inner">
              <Globe2 className="w-4 h-4 sm:w-5 sm:h-5 animate-[spin_30s_linear_infinite]" />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm sm:text-base tracking-wider uppercase text-white truncate drop-shadow-sm">
                  {config.cityName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/50 text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300 shrink-0">
                  {config.label}
                </span>
              </div>
              {config.showDate && (
                <span className="text-[11px] sm:text-xs font-mono text-slate-400 truncate">
                  {formattedDate()}
                </span>
              )}
            </div>
          </div>

          {/* Right: Live World Time Digits (increased by 30%) & Settings Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="px-2.5 sm:px-3 py-1 rounded-xl bg-black/70 border border-cyan-500/40 flex items-center gap-1.5 shadow-inner">
              <Clock className="w-4 h-4 text-cyan-400 hidden xs:inline shrink-0" />
              <span className="font-digital font-bold text-lg sm:text-2xl tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                {formattedTime()}
              </span>
            </div>

            {/* Quick Settings Gear Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Edit Stage World Clock Settings (Default: Nairobi)"
              aria-label="Clock Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base sm:text-lg text-white tracking-wide">
                    World Clock Settings
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Default: Nairobi Time (East Africa Time)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currently Active Display */}
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  Showing on Screen
                </div>
                <div className="text-base font-display font-bold text-white flex items-center gap-2">
                  <span>{config.cityName}</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">({config.country})</span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Timezone: <span className="text-cyan-300">{config.timezone}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-digital text-xl font-bold text-cyan-400">
                  {formattedTime()}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {formattedDate()}
                </div>
              </div>
            </div>

            {/* Format Toggles */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleToggle24Hour}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  config.is24Hour
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                <span>Format</span>
                <span className="text-sm font-digital">{config.is24Hour ? '24-HOUR' : '12-HOUR'}</span>
              </button>

              <button
                onClick={handleToggleSeconds}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  config.showSeconds
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                <span>Seconds</span>
                <span className="text-sm font-digital">{config.showSeconds ? 'VISIBLE' : 'HIDDEN'}</span>
              </button>

              <button
                onClick={handleToggleDate}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  config.showDate
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                <span>Calendar Date</span>
                <span className="text-sm font-digital">{config.showDate ? 'SHOW' : 'HIDE'}</span>
              </button>
            </div>

            {/* Select City Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Select World City / Timezone
                </label>
                {config.cityId !== 'nairobi' && (
                  <button
                    onClick={handleResetToNairobi}
                    className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Nairobi (Default)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {PRESET_STAGE_CITIES.map((item) => {
                  const isSelected = config.timezone === item.timezone;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectPreset(item)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/50'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs truncate">
                            {item.name}
                          </span>
                          {item.id === 'nairobi' && (
                            <span className="px-1 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-[8px] font-mono font-bold text-emerald-400">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {item.label} &bull; {item.country}
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom IANA Timezone Input */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">
                OR TYPE A CITY / REGION TIMEZONE
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Africa/Kampala, America/Chicago"
                  value={customTzInput}
                  onChange={(e) => {
                    setCustomTzInput(e.target.value);
                    setCustomTzError('');
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleApplyCustomTimezone}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
                >
                  Apply
                </button>
              </div>
              {customTzError && (
                <p className="text-[11px] font-mono text-rose-400 mt-1">
                  {customTzError}
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleResetToNairobi}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset to Nairobi (EAT)</span>
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-display font-extrabold uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
