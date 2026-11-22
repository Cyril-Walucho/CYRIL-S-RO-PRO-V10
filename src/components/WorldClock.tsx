import React, { useState, useEffect } from 'react';
import { Globe2, Clock, Settings2, Plus, X, Sun, Moon } from 'lucide-react';

export interface WorldClockCity {
  id: string;
  name: string;
  timezone: string;
  country: string;
  label: string;
}

export const PRESET_CITIES: WorldClockCity[] = [
  { id: 'utc', name: 'UTC / GMT', timezone: 'UTC', country: 'World Standard Time', label: 'UTC' },
  { id: 'nairobi', name: 'Nairobi', timezone: 'Africa/Nairobi', country: 'Kenya (EAT)', label: 'EAT' },
  { id: 'london', name: 'London', timezone: 'Europe/London', country: 'United Kingdom', label: 'LON' },
  { id: 'new_york', name: 'New York', timezone: 'America/New_York', country: 'USA (Eastern)', label: 'NYC' },
  { id: 'los_angeles', name: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA (Pacific)', label: 'LAX' },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan (JST)', label: 'TYO' },
  { id: 'paris', name: 'Paris', timezone: 'Europe/Paris', country: 'France (CET)', label: 'PAR' },
  { id: 'dubai', name: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE (GST)', label: 'DXB' },
  { id: 'singapore', name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore (SGT)', label: 'SGP' },
  { id: 'sydney', name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia (AEST)', label: 'SYD' }
];

interface WorldClockProps {
  compact?: boolean;
  onlyClocks?: boolean;
}

export const WorldClock: React.FC<WorldClockProps> = ({
  compact = false,
  onlyClocks = false
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(true);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>(['utc', 'nairobi', 'london', 'new_york']);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCityTime = (timezone: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24Hour
      };
      return new Intl.DateTimeFormat('en-US', options).format(now);
    } catch {
      return '--:--:--';
    }
  };

  const getCityDate = (timezone: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      };
      return new Intl.DateTimeFormat('en-US', options).format(now);
    } catch {
      return '';
    }
  };

  const isDaytime = (timezone: string) => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false
      }).format(now);
      const h = parseInt(hourStr, 10);
      return h >= 6 && h < 18;
    } catch {
      return true;
    }
  };

  const localTimeFormatted = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !is24Hour
    };
    return new Intl.DateTimeFormat('en-US', options).format(now);
  };

  const localDateFormatted = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(now);
  };

  const localTzName = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ');
    } catch {
      return 'Local';
    }
  };

  const toggleCity = (cityId: string) => {
    if (selectedCityIds.includes(cityId)) {
      if (selectedCityIds.length > 1) {
        setSelectedCityIds(selectedCityIds.filter(id => id !== cityId));
      }
    } else {
      if (selectedCityIds.length < 6) {
        setSelectedCityIds([...selectedCityIds, cityId]);
      }
    }
  };

  const activeCities = PRESET_CITIES.filter(c => selectedCityIds.includes(c.id));

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-900/95 via-slate-950 to-cyan-950/40 border border-cyan-500/30 rounded-xl p-2.5 shadow-lg overflow-hidden text-slate-100 select-none">
      {/* World Clock Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
            <Globe2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
                WORLD CLOCK
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            {!onlyClocks && (
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                Live times for teams &amp; speakers worldwide
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIs24Hour(!is24Hour)}
            className="px-1.5 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-cyan-300 transition-colors cursor-pointer"
            title="Toggle 12h / 24h format"
          >
            {is24Hour ? '24H' : '12H'}
          </button>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`p-1 rounded border transition-colors cursor-pointer ${
              isConfigOpen
                ? 'bg-cyan-900/80 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Configure world clock cities"
          >
            <Settings2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Studio Local Banner - Only Clock in onlyClocks mode */}
      <div className="mt-1.5 p-2 rounded-lg bg-slate-950/90 border border-cyan-500/30 flex items-center justify-between shadow-inner shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 uppercase font-bold">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="truncate">YOUR TIME{!onlyClocks ? ` • ${localTzName()}` : ''}</span>
          </div>
          {!onlyClocks && (
            <div className="text-[10px] text-slate-400 font-mono">
              {localDateFormatted()}
            </div>
          )}
        </div>
        <div className="font-digital text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight glow-cyan">
          {localTimeFormatted()}
        </div>
      </div>

      {/* City Config Drawer */}
      {isConfigOpen && (
        <div className="mt-1.5 p-2 rounded-lg bg-slate-900 border border-cyan-500/40 text-xs shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
              Select Visible Cities (Max 6)
            </span>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
            {PRESET_CITIES.map(city => {
              const active = selectedCityIds.includes(city.id);
              return (
                <button
                  key={city.id}
                  onClick={() => toggleCity(city.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {city.name} ({city.label})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid of Selected World Cities */}
      <div className={`flex-1 min-h-0 grid gap-1.5 mt-1.5 overflow-y-auto ${
        compact || activeCities.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'
      }`}>
        {activeCities.map(city => {
          const timeStr = formatCityTime(city.timezone);
          const dateStr = getCityDate(city.timezone);
          const day = isDaytime(city.timezone);
          const isUtc = city.id === 'utc';

          return (
            <div
              key={city.id}
              className={`p-2 rounded-lg border flex flex-col justify-between transition-all ${
                isUtc
                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`px-1 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                      isUtc
                        ? 'bg-emerald-500 text-black'
                        : 'bg-slate-800 text-cyan-300 border border-slate-700'
                    }`}
                  >
                    {city.label}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200 truncate">
                    {city.name}
                  </span>
                </div>
                {!onlyClocks && (
                  day ? (
                    <span title="Daytime"><Sun className="w-2.5 h-2.5 text-amber-400 shrink-0" /></span>
                  ) : (
                    <span title="Nighttime"><Moon className="w-2.5 h-2.5 text-indigo-400 shrink-0" /></span>
                  )
                )}
              </div>

              <div className="flex items-baseline justify-between mt-1">
                {!onlyClocks ? (
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    {dateStr}
                  </div>
                ) : (
                  <div />
                )}
                <div
                  className={`font-digital text-base sm:text-lg font-bold tracking-tight ${
                    isUtc ? 'text-emerald-400' : 'text-slate-100'
                  }`}
                >
                  {timeStr}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Broadcast Timecode & Synchronized Status (Hidden in onlyClocks mode) */}
      {!onlyClocks && (
        <div className="pt-1 mt-1 border-t border-cyan-500/20 flex items-center justify-between text-[9px] font-mono text-slate-400 shrink-0">
          <span className="text-cyan-400 font-semibold">LIVE CLOCK SYNCED</span>
          <span className="text-slate-500">
            YOUR TIME: {localTimeFormatted()}
          </span>
        </div>
      )}
    </div>
  );
};
