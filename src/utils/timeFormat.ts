/**
 * Utility functions for time formatting, parsing, and show timing calculations
 */

export function formatTime(seconds: number, forceHours: boolean = false): string {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(Math.round(seconds));
  const prefix = isNegative ? '-' : '';

  if (forceHours) {
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    return `${prefix}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Broadcast standard: Allow duration to run up to 60:00 min:sec (and up to 99:59)
  // Segments up to 99 minutes (5999 seconds) are cleanly formatted in MM:SS
  if (absSeconds < 6000) {
    const totalMinutes = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${prefix}${String(totalMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // 100+ minutes format with hours
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;
  return `${prefix}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Parses user input or spreadsheet values into seconds.
 * Accepts "60:00", "03:30", "1:15:00", "90", "5m", "1h 20m", Excel fractional days (0.00347...)
 */
export function parseTimeToSeconds(input: string | number): number {
  if (typeof input === 'number') {
    // If it's a fractional number < 1.0 (Excel time serial where 1 day = 24h = 86400s)
    if (input > 0 && input < 1) {
      return Math.round(input * 86400);
    }
    return Math.max(0, Math.round(input));
  }
  if (!input) return 0;

  const rawStr = String(input).trim();
  const str = rawStr.toLowerCase();

  // Check if string represents an Excel fractional day e.g. "0.0034722222"
  const floatVal = parseFloat(str);
  if (!isNaN(floatVal) && floatVal > 0 && floatVal < 1 && !str.includes(':') && !str.includes('m') && !str.includes('s')) {
    return Math.round(floatVal * 86400);
  }

  // "1h 30m 10s" or "5m" or "45s" or "5 min"
  let parsedByUnit = 0;
  let matchedUnit = false;

  const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hours?)/);
  if (hoursMatch) {
    parsedByUnit += parseFloat(hoursMatch[1]) * 3600;
    matchedUnit = true;
  }
  const minMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes?)/);
  if (minMatch) {
    parsedByUnit += parseFloat(minMatch[1]) * 60;
    matchedUnit = true;
  }
  const secMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds?)/);
  if (secMatch) {
    parsedByUnit += parseFloat(secMatch[1]);
    matchedUnit = true;
  }
  if (matchedUnit) return Math.round(parsedByUnit);

  // "HH:MM:SS" or "MM:SS" or "M:SS"
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseFloat(p.trim()));
    if (parts.every(p => !isNaN(p))) {
      if (parts.length === 3) {
        return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      } else if (parts.length === 2) {
        // e.g. "60:00" = 60 * 60 + 0 = 3600s
        return Math.round(parts[0] * 60 + parts[1]);
      }
    }
  }

  // Raw digits
  if (!isNaN(floatVal) && floatVal >= 0) {
    return Math.round(floatVal);
  }

  return 0;
}

/**
 * Given a base time string "HH:MM:SS" or "HH:MM" and offset seconds, returns the new time string
 */
export function addSecondsToClockTime(baseTime: string, secondsToAdd: number): string {
  const parts = baseTime.split(':').map(p => parseInt(p, 10) || 0);
  let totalSeconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  totalSeconds = (totalSeconds + secondsToAdd) % 86400;
  if (totalSeconds < 0) totalSeconds += 86400;

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Returns the current local Time of Day formatted as "HH:MM:SS"
 */
export function getCurrentTimeOfDay(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}
