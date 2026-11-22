import * as XLSX from 'xlsx';
import { RundownItem } from '../types/rundown';
import { formatTime } from './timeFormat';

export interface SmartExtractResult {
  items: RundownItem[];
  detectedFormat: string;
  showTitle?: string;
  plannedStartTime?: string;
  warnings: string[];
  engine: 'local-smart' | 'gemini-ai';
}

export const CATEGORY_PALETTE_MAP: Record<string, { name: string; color: string }> = {
  cyan: { name: 'Opening / Intro', color: 'cyan' },
  emerald: { name: 'Main Content / Live', color: 'emerald' },
  amber: { name: 'Break / Ad', color: 'amber' },
  purple: { name: 'Interview / Guest', color: 'purple' },
  blue: { name: 'Video Clip', color: 'blue' },
  orange: { name: 'Sponsor / Ad Read', color: 'orange' },
  rose: { name: 'Closing / End', color: 'rose' },
  indigo: { name: 'Music / Sound', color: 'indigo' },
  fuchsia: { name: 'Graphics Item', color: 'fuchsia' },
};

export function getCategoryName(color?: string): string {
  if (!color) return 'Main Content / Live';
  const c = color.toLowerCase().trim();
  return CATEGORY_PALETTE_MAP[c]?.name || 'Main Content / Live';
}

export function resolveColorFromCategory(
  val?: string,
  titleFallback?: string,
  notesFallback?: string
): string {
  const tryMatch = (rawInput?: string): string | null => {
    if (!rawInput || !rawInput.trim()) return null;
    const raw = rawInput.trim().toLowerCase();

    if (['cyan', 'emerald', 'amber', 'purple', 'blue', 'orange', 'rose', 'indigo', 'fuchsia'].includes(raw)) {
      return raw;
    }
    if (raw === 'green') return 'emerald';
    if (raw === 'yellow' || raw === 'gold') return 'amber';
    if (raw === 'red' || raw === 'pink') return 'rose';
    if (raw === 'violet') return 'purple';
    if (raw === 'teal' || raw === 'aqua') return 'cyan';
    if (raw === 'magenta') return 'fuchsia';

    if (
      raw.includes('graphic') ||
      raw.includes('gfx') ||
      raw.includes('chyron') ||
      raw.includes('lower third') ||
      raw.includes('lower-third') ||
      raw.includes('l3') ||
      raw.includes('overlay') ||
      raw.includes('strap') ||
      raw.includes('cg ') ||
      raw === 'cg' ||
      raw.includes('slate') ||
      raw.includes('slide')
    ) {
      return 'fuchsia';
    }
    if (
      raw.includes('intro') ||
      raw.includes('opener') ||
      raw.includes('cold open') ||
      raw.includes('countdown') ||
      raw.includes('walk-in') ||
      raw.includes('doors') ||
      raw.includes('pre-show') ||
      raw.includes('preshow')
    ) {
      return 'cyan';
    }
    if (
      raw.includes('comm') ||
      raw.includes('ad break') ||
      raw.includes('spot') ||
      raw.includes('intermission') ||
      /\bbreak\b/.test(raw)
    ) {
      return 'amber';
    }
    if (raw.includes('sponsor') || raw.includes('promo') || raw.includes('ad read') || raw.includes('spotlight')) {
      return 'orange';
    }
    if (
      raw.includes('interview') ||
      raw.includes('guest') ||
      raw.includes('panel') ||
      raw.includes('q&a') ||
      raw.includes('discussion') ||
      raw.includes('fireside')
    ) {
      return 'purple';
    }
    if (
      raw.includes('vt') ||
      raw.includes('video') ||
      raw.includes('roll') ||
      raw.includes('clip') ||
      raw.includes('package') ||
      raw.includes('pkg') ||
      raw.includes('b-roll') ||
      raw.includes('demo')
    ) {
      return 'blue';
    }
    if (
      raw.includes('music') ||
      raw.includes('sfx') ||
      raw.includes('song') ||
      raw.includes('band') ||
      raw.includes('worship') ||
      raw.includes('hymn') ||
      raw.includes('anthem') ||
      raw.includes('choir') ||
      raw.includes('audio track')
    ) {
      return 'indigo';
    }
    if (
      raw.includes('outro') ||
      raw.includes('closing') ||
      raw.includes('wrap') ||
      raw.includes('credit') ||
      raw.includes('sign-off') ||
      raw.includes('sign off') ||
      raw.includes('benediction') ||
      raw.includes('farewell')
    ) {
      return 'rose';
    }
    if (
      raw.includes('live') ||
      raw.includes('content') ||
      raw.includes('news') ||
      raw.includes('topic') ||
      raw.includes('monologue') ||
      raw.includes('headline') ||
      raw.includes('keynote') ||
      raw.includes('sermon') ||
      raw.includes('talk') ||
      raw.includes('speech') ||
      raw.includes('welcome')
    ) {
      return 'emerald';
    }
    return null;
  };

  return (
    tryMatch(val) ||
    tryMatch(titleFallback) ||
    tryMatch(notesFallback) ||
    'emerald'
  );
}

/**
 * Parses a clock time of day (e.g. "09:15", "9:15 AM", "19:00:30", "14h30", "0.3854")
 * into seconds since midnight (0..86399). Returns null if not a clock time.
 */
export function parseClockTimeOfDayToSeconds(raw: string): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();

  // Excel serial time of day fraction e.g. 0.375 = 09:00
  if (/^0?\.\d+$/.test(s)) {
    const f = parseFloat(s);
    if (f > 0 && f < 1) {
      return Math.round(f * 86400);
    }
  }

  // Match "9:05 AM", "09:05:30 PM", "19:00", "19:00:00", "9.30am", "14h30"
  const m = s.match(/^(\d{1,2})[:h.](\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = m[3] ? parseInt(m[3], 10) : 0;
  const ampm = m[4]?.toLowerCase();

  if (min >= 60 || sec >= 60 || h > 24) return null;
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;

  return h * 3600 + min * 60 + sec;
}

/**
 * Parses almost any duration expression into seconds.
 * Handles:
 * - "05:00", "00:05:30", "1:15:00"
 * - "5'30\"", "5'30", "45\"" (broadcast prime/quote notation)
 * - "5m", "5 mins", "1h 20m 10s", "90s", "2.5 minutes"
 * - "09:00 - 09:15", "9:00 AM - 9:15 AM" (time ranges -> calculates diff)
 * - Excel serial numbers (< 1)
 * - Bare numbers with optional default unit hint
 */
export function parseFlexibleDuration(
  rawInput: string | number | undefined | null,
  unitHint: 'minutes' | 'seconds' | 'auto' = 'auto'
): number {
  if (rawInput === undefined || rawInput === null) return 0;
  if (typeof rawInput === 'number') {
    if (rawInput <= 0) return 0;
    if (rawInput < 1) return Math.round(rawInput * 86400);
    if (unitHint === 'minutes') return Math.round(rawInput * 60);
    if (unitHint === 'seconds') return Math.round(rawInput);
    return rawInput <= 60 ? Math.round(rawInput * 60) : Math.round(rawInput);
  }

  const raw = String(rawInput).trim();
  if (!raw) return 0;

  // 1. Time range like "09:00 - 09:15" or "9:00 AM – 9:25 AM"
  const rangeMatch = raw.match(
    /(\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:am|pm)?)/i
  );
  if (rangeMatch) {
    const t1 = parseClockTimeOfDayToSeconds(rangeMatch[1].trim());
    const t2 = parseClockTimeOfDayToSeconds(rangeMatch[2].trim());
    if (t1 !== null && t2 !== null) {
      let diff = t2 - t1;
      if (diff <= 0) diff += 86400; // midnight crossover
      if (diff > 0 && diff <= 43200) return diff;
    }
  }

  const str = raw.toLowerCase().replace(/^~|approx\.?/gi, '').trim();

  // 2. Broadcast prime notation: 5'30", 5'00, 45"
  const primeMatch = str.match(/^(\d+)\s*['′]\s*(\d{1,2})?\s*(?:["″]|'')?$/);
  if (primeMatch) {
    const mins = parseInt(primeMatch[1], 10);
    const secs = primeMatch[2] ? parseInt(primeMatch[2], 10) : 0;
    return mins * 60 + secs;
  }
  const doublePrimeOnly = str.match(/^(\d+)\s*(?:["″]|'')$/);
  if (doublePrimeOnly) {
    return parseInt(doublePrimeOnly[1], 10);
  }

  // 3. Explicit unit tokens: 1h 20m 30s, 5 mins, 90s
  let unitTotal = 0;
  let matchedUnit = false;
  const hMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  if (hMatch) {
    unitTotal += parseFloat(hMatch[1]) * 3600;
    matchedUnit = true;
  }
  const mMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/);
  if (mMatch) {
    unitTotal += parseFloat(mMatch[1]) * 60;
    matchedUnit = true;
  }
  const sMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)\b/);
  if (sMatch) {
    unitTotal += parseFloat(sMatch[1]);
    matchedUnit = true;
  }
  if (matchedUnit && unitTotal > 0) {
    return Math.round(unitTotal);
  }

  // 4. Colon notation: HH:MM:SS or MM:SS
  if (str.includes(':')) {
    const cleanColon = str.replace(/\s*(am|pm)$/i, '').trim();
    const parts = cleanColon.split(':').map(p => Number(p.trim()));
    if (parts.length >= 2 && parts.every(p => !isNaN(p) && p >= 0)) {
      if (parts.length === 3) {
        return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      }
      if (parts.length === 2) {
        return Math.round(parts[0] * 60 + parts[1]);
      }
    }
  }

  // 5. Excel decimal fraction
  if (/^0?\.\d+$/.test(str)) {
    const f = parseFloat(str);
    if (f > 0 && f < 1) {
      return Math.round(f * 86400);
    }
  }

  // 6. Plain numeric string
  if (/^\d+(?:\.\d+)?$/.test(str)) {
    const n = parseFloat(str);
    if (n <= 0) return 0;
    if (unitHint === 'minutes') return Math.round(n * 60);
    if (unitHint === 'seconds') return Math.round(n);
    // Heuristic: bare integers <= 60 in rundowns almost always mean minutes (e.g. "5", "10", "15")
    return n <= 60 ? Math.round(n * 60) : Math.round(n);
  }

  return 0;
}

/**
 * Extracts an inline duration written inside a title/description like "(5 mins)" or "[03:30]"
 */
function extractInlineDuration(text: string): { seconds: number; cleanedText: string } {
  if (!text) return { seconds: 0, cleanedText: text };

  // Matches e.g. "(5 mins)", "[03:30]", "(1h 10m)", "[45s]", "(3'30\")", "(45\")"
  const parenMatch = text.match(
    /[\[(]\s*((?:\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?|s|sec|secs|seconds?)\s*)+|\d{1,2}:\d{2}(?::\d{2})?|\d+\s*['′]\s*\d{0,2}\s*(?:["″]|'')?|\d+\s*(?:["″]|''))\s*[\])]/i
  );
  if (parenMatch) {
    const sec = parseFlexibleDuration(parenMatch[1], 'auto');
    if (sec >= 5) {
      const cleanedText = text.replace(parenMatch[0], '').replace(/\s{2,}/g, ' ').trim();
      return { seconds: sec, cleanedText };
    }
  }

  return { seconds: 0, cleanedText: text };
}

/**
 * Detects delimiter automatically (comma, tab, semicolon, pipe) and parses RFC4180 CSV/TSV/PSV
 */
export function parseSmartDelimited(text: string): { rows: string[][]; delimiter: string } {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return { rows: [], delimiter: ',' };

  const sampleLines = cleaned.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 15);
  const candidates = ['\t', ',', ';', '|'];

  let bestDelimiter = ',';
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = sampleLines.map(line => {
      let inQ = false;
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQ = !inQ;
        else if (line[i] === delim && !inQ) count++;
      }
      return count;
    });
    const nonZeroLines = counts.filter(c => c > 0).length;
    if (nonZeroLines === 0) continue;
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + Math.abs(b - avg), 0) / counts.length;
    // Favor tabs & commas slightly on ties, reward consistent column counts
    const tieBonus = delim === '\t' ? 0.5 : delim === ',' ? 0.3 : 0;
    const score = nonZeroLines * 3 + avg - variance + tieBonus;
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delim;
    }
  }

  // Fallback for fixed-width space-aligned tables (2+ spaces separating columns)
  if (bestScore <= 0 && sampleLines.length >= 2) {
    const multiSpaceLines = sampleLines.filter(l => /\S\s{2,}\S/.test(l)).length;
    if (multiSpaceLines >= Math.ceil(sampleLines.length * 0.6)) {
      const rows = cleaned
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => l.split(/\s{2,}/).map(c => c.trim()));
      return { rows, delimiter: 'spaces' };
    }
  }

  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let insideQuote = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === bestDelimiter && !insideQuote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell.trim());
      if (row.some(c => c.length > 0)) {
        // Skip markdown divider rows like | --- | --- |
        const isDivider = row.every(c => /^[:\-_=*\s]*$/.test(c));
        if (!isDivider) {
          lines.push(row);
        }
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c.length > 0) && !row.every(c => /^[:\-_=*\s]*$/.test(c))) {
      lines.push(row);
    }
  }

  // Trim leading/trailing empty cells produced by markdown pipes "| a | b |"
  if (bestDelimiter === '|') {
    return {
      rows: lines.map(r => {
        const copy = [...r];
        if (copy.length > 1 && copy[0] === '') copy.shift();
        if (copy.length > 1 && copy[copy.length - 1] === '') copy.pop();
        return copy;
      }),
      delimiter: bestDelimiter
    };
  }

  return { rows: lines, delimiter: bestDelimiter };
}

type ColRole =
  | 'seg'
  | 'title'
  | 'category'
  | 'color'
  | 'presenter'
  | 'duration'
  | 'duration_min'
  | 'duration_sec'
  | 'start_time'
  | 'end_time'
  | 'notes'
  | 'audio'
  | 'status'
  | 'unknown';

function classifyHeaderCell(rawHeader: string): { role: ColRole; weight: number } {
  const h = rawHeader.toLowerCase().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!h) return { role: 'unknown', weight: 0 };

  if (/^(#|no\.?|num\.?|number|seg\.?\s*#?|segment\s*#?|item\s*#?|item\s*no\.?|cue\s*#?|sl\.?\s*no\.?|s\/n|sr\.?|order|seq|sequence|part|block|index)$/i.test(h)) {
    return { role: 'seg', weight: 2 };
  }
  if (/^(color|colour|color\s*stripe|colour\s*stripe|stripe|stripe\s*color)$/i.test(h)) {
    return { role: 'color', weight: 2 };
  }
  if (/^(category|cat|genre|type|segment\s*type|block\s*type|segment\s*category|kind|format|tag|label|dept|department)$/i.test(h)) {
    return { role: 'category', weight: 2 };
  }
  if (/^(title|segment\s*name|segment\s*title|item\s*name|item\s*title|topic|activity|subject|programme|program|element|event|event\s*title|headline|story|slug|session|agenda|content|what|shot|action|description)$/i.test(h)) {
    return { role: 'title', weight: 3 };
  }
  if (/title|segment|topic|activity|agenda|programme|program|story|slug|headline/i.test(h) && !/time|dur|len|no|#|id|type|cat|note/i.test(h)) {
    return { role: 'title', weight: 2 };
  }
  if (/^(start|start\s*time|time\s*in|in\s*time|in|begins|from|air\s*time|tod|time\s*of\s*day|clock|cue\s*time|scheduled\s*start|planned\s*start)$/i.test(h)) {
    return { role: 'start_time', weight: 2 };
  }
  if (/^(end|end\s*time|time\s*out|out\s*time|out|ends|to|finish|off\s*air)$/i.test(h)) {
    return { role: 'end_time', weight: 2 };
  }
  if (/^(mins?|minutes?)$/i.test(h)) {
    return { role: 'duration_min', weight: 2 };
  }
  if (/^(secs?|seconds?)$/i.test(h)) {
    return { role: 'duration_sec', weight: 2 };
  }
  if (/duration|dur\b|length|len\b|runtime|run\s*time|running\s*time|trt\b|planned\s*time|planned\s*dur|est\.?\s*time|est\.?\s*dur|timing|allocated|slot\s*time|target\s*time|seg\s*dur/i.test(h) || h === 'time') {
    return { role: 'duration', weight: 3 };
  }
  if (/^(presenter|presenters|talent|speaker|speakers|host|hosts|lead|who|mc|emcee|anchor|anchors|guest|guests|facilitator|minister|pastor|moderator|panel|artist|person|owner|pic|by|cast|role|vo|voiceover|responsible|person\s*in\s*charge)$/i.test(h)) {
    return { role: 'presenter', weight: 2 };
  }
  if (/presenter|speaker|talent|host|anchor|who|emcee|person/i.test(h)) {
    return { role: 'presenter', weight: 1.5 };
  }
  if (/^(audio|audio\s*notes?|audio\s*cues?|sound|sound\s*cues?|mic|mics|microphones?|music|sfx|audio\s*track|fader|pa|foh|a1|band)$/i.test(h) || /\b(audio|mic|mics|sound|sfx)\b/i.test(h)) {
    return { role: 'audio', weight: 2 };
  }
  if (/^(notes?|script|cues?|cue\s*notes?|details?|tech|technical|tech\s*notes?|director|director\s*notes?|remarks?|production\s*notes?|instructions?|cam|camera|cameras|gfx|graphics|lower\s*third|l3|lighting|lx|visuals?|video|vt|playback|screen|led|slides?|stage|staging|teleprompter|prompter)$/i.test(h) ||
      /\b(note|cue|camera|cam|gfx|graphic|lighting|visual|video|vt|stage|screen|slides|script|remarks)\b/i.test(h)) {
    return { role: 'notes', weight: 1.5 };
  }
  if (/^(status|state|flag|ready)$/i.test(h)) {
    return { role: 'status', weight: 1.5 };
  }

  return { role: 'unknown', weight: 0 };
}

function isSummaryOrNoiseRow(row: string[], titleVal: string): boolean {
  const joined = row.map(c => c.trim()).filter(Boolean).join(' ').toLowerCase();
  if (!joined) return true;
  if (/^[-=_*.\s]+$/.test(joined)) return true;

  const t = titleVal.trim().toLowerCase();
  if (
    /^(total|grand\s*total|subtotal|sub-total|total\s*runtime|total\s*duration|show\s*total|end\s*of\s*rundown|end\s*of\s*show|page\s*\d+\s*of\s*\d+)$/i.test(t) ||
    (/^(total|grand\s*total|subtotal|total\s*runtime|total\s*time)\b/i.test(joined) && row.filter(c => c.trim()).length <= 4)
  ) {
    return true;
  }
  return false;
}

/**
 * Intelligent 2D Matrix Analyzer: handles banners/metadata before headers,
 * 100+ column variations, Start/End clock math, split Min/Sec cols, multi-cue merging,
 * and headerless fallback fingerprinting.
 */
export function smartParseSpreadsheetRows(rows: string[][]): SmartExtractResult {
  const warnings: string[] = [];
  if (!rows || rows.length === 0) {
    return { items: [], detectedFormat: 'Empty Table', warnings: ['No rows found'], engine: 'local-smart' };
  }

  // 1. Scan top 25 rows to locate the true header row
  let bestHeaderIdx = -1;
  let bestHeaderScore = 0;
  let bestHeaderCols = 0;

  const scanLimit = Math.min(25, rows.length);
  for (let r = 0; r < scanLimit; r++) {
    const row = rows[r];
    if (!row || row.every(c => !c.trim())) continue;

    let rowScore = 0;
    const matchedRoles = new Set<ColRole>();
    for (const cell of row) {
      const { role, weight } = classifyHeaderCell(cell);
      if (role !== 'unknown') {
        rowScore += weight;
        matchedRoles.add(role);
      }
    }

    // Prefer row with diverse column roles (e.g., title + duration + presenter)
    const diversityBonus = matchedRoles.size >= 3 ? matchedRoles.size * 1.5 : 0;
    const totalScore = rowScore + diversityBonus;

    if (matchedRoles.size >= 2 && totalScore > bestHeaderScore) {
      bestHeaderScore = totalScore;
      bestHeaderIdx = r;
      bestHeaderCols = matchedRoles.size;
    }
  }

  // Handle two-row grouped headers (e.g., Row N is "TIMING | CONTENT", Row N+1 is "Start | End | Dur | Title | Speaker")
  if (bestHeaderIdx >= 0 && bestHeaderIdx + 1 < rows.length) {
    const nextRow = rows[bestHeaderIdx + 1];
    const nextRoles = new Set<ColRole>();
    let nextScore = 0;
    for (const cell of nextRow) {
      const { role, weight } = classifyHeaderCell(cell);
      if (role !== 'unknown') {
        nextScore += weight;
        nextRoles.add(role);
      }
    }
    if (nextRoles.size > bestHeaderCols || (nextRoles.size >= 2 && nextScore > bestHeaderScore)) {
      bestHeaderIdx = bestHeaderIdx + 1;
    }
  }

  // Extract showTitle & plannedStartTime from pre-header banner rows
  let showTitle: string | undefined;
  let plannedStartTime: string | undefined;
  if (bestHeaderIdx > 0) {
    for (let r = 0; r < bestHeaderIdx; r++) {
      const nonEmpty = rows[r].map(c => c.trim()).filter(Boolean);
      if (nonEmpty.length === 0) continue;
      for (const cell of nonEmpty) {
        if (!plannedStartTime) {
          const startMatch = cell.match(/(?:start|air\s*time|doors|begins|kickoff|time)\s*[:\-]?\s*(\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:am|pm)?)/i);
          if (startMatch) {
            const sec = parseClockTimeOfDayToSeconds(startMatch[1]);
            if (sec !== null) {
              const h = Math.floor(sec / 3600);
              const m = Math.floor((sec % 3600) / 60);
              const s = sec % 60;
              plannedStartTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
          }
        }
        if (!showTitle && cell.length >= 4 && cell.length <= 80 && !/^(date|page|version|printed|updated|rev|prepared)/i.test(cell)) {
          showTitle = cell;
        }
      }
    }
  }

  const hasHeader = bestHeaderIdx !== -1;
  const headerRow = hasHeader ? rows[bestHeaderIdx] : [];
  const dataRows = hasHeader ? rows.slice(bestHeaderIdx + 1) : rows;
  if (dataRows.length === 0) {
    return { items: [], detectedFormat: 'Header Only', warnings: ['No data rows found below header'], engine: 'local-smart' };
  }

  let idxSeg = -1;
  let idxTitle = -1;
  let idxCategory = -1;
  let idxColor = -1;
  let idxPresenter = -1;
  let idxDuration = -1;
  let idxDurationMin = -1;
  let idxDurationSec = -1;
  let idxStartTime = -1;
  let idxEndTime = -1;
  let idxStatus = -1;
  const noteIndices: number[] = [];
  const audioIndices: number[] = [];

  if (hasHeader) {
    headerRow.forEach((rawH, i) => {
      const { role } = classifyHeaderCell(rawH);
      if (role === 'seg' && idxSeg === -1) idxSeg = i;
      else if (role === 'title') {
        // Prefer explicit Title / Segment Name / Topic over generic Description/Item if already set
        if (idxTitle === -1 || /^(title|segment\s*name|topic|activity|programme|program)$/i.test(rawH.trim())) {
          if (idxTitle !== -1 && !noteIndices.includes(idxTitle)) {
            // Keep previous lower-priority text column (like Description) as notes
            if (/desc|detail|action/i.test(headerRow[idxTitle])) {
              noteIndices.push(idxTitle);
            }
          }
          idxTitle = i;
        } else {
          noteIndices.push(i);
        }
      } else if (role === 'category' && idxCategory === -1) idxCategory = i;
      else if (role === 'color' && idxColor === -1) idxColor = i;
      else if (role === 'presenter' && idxPresenter === -1) idxPresenter = i;
      else if (role === 'duration_min' && idxDurationMin === -1) idxDurationMin = i;
      else if (role === 'duration_sec' && idxDurationSec === -1) idxDurationSec = i;
      else if (role === 'duration' && idxDuration === -1) idxDuration = i;
      else if (role === 'start_time' && idxStartTime === -1) idxStartTime = i;
      else if (role === 'end_time' && idxEndTime === -1) idxEndTime = i;
      else if (role === 'notes') noteIndices.push(i);
      else if (role === 'audio') audioIndices.push(i);
      else if (role === 'status' && idxStatus === -1) idxStatus = i;
    });
  }

  // Fingerprint columns if duration or title is missing (works even on headerless company exports!)
  const maxCols = Math.max(...dataRows.slice(0, 15).map(r => r.length), headerRow.length, 1);
  if (idxDuration === -1 && idxDurationMin === -1 && idxStartTime === -1) {
    const colScores = new Array(maxCols).fill(0);
    dataRows.slice(0, 15).forEach(row => {
      row.forEach((cell, c) => {
        if (c === idxTitle || c === idxSeg || c === idxPresenter) return;
        const v = cell.trim();
        if (!v) return;
        if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(v)) colScores[c] += 6;
        else if (/^\d+(?:\.\d+)?\s*(?:h|hr|m|min|mins|s|sec)$/i.test(v)) colScores[c] += 5;
        else if (/^\d+'\d{1,2}"?$/.test(v)) colScores[c] += 5;
        else if (!isNaN(Number(v)) && Number(v) > 0 && Number(v) < 7200) colScores[c] += 2;
      });
    });
    let bestC = -1;
    let maxS = 0;
    colScores.forEach((s, c) => {
      if (s > maxS) {
        maxS = s;
        bestC = c;
      }
    });
    if (bestC >= 0 && maxS >= 3) {
      idxDuration = bestC;
    }
  }

  // If title is still unassigned, pick the column with richest descriptive text strings
  if (idxTitle === -1) {
    const textScores = new Array(maxCols).fill(0);
    dataRows.slice(0, 15).forEach(row => {
      row.forEach((cell, c) => {
        if (c === idxSeg || c === idxDuration || c === idxStartTime || c === idxEndTime) return;
        const v = cell.trim();
        if (!v || /^\d+[:.]?\d*$/.test(v)) return;
        if (v.length >= 4 && v.length <= 90) textScores[c] += Math.min(v.length, 30);
      });
    });
    let bestT = -1;
    let maxTS = 0;
    textScores.forEach((s, c) => {
      if (s > maxTS) {
        maxTS = s;
        bestT = c;
      }
    });
    idxTitle = bestT >= 0 ? bestT : (idxSeg === 0 ? 1 : 0);
  }

  // Determine bare-number duration unit hint by inspecting header & entire column distribution
  let durUnitHint: 'minutes' | 'seconds' | 'auto' = 'auto';
  if (idxDuration >= 0 && headerRow[idxDuration]) {
    const h = headerRow[idxDuration].toLowerCase();
    if (/sec/.test(h)) durUnitHint = 'seconds';
    else if (/min/.test(h)) durUnitHint = 'minutes';
  }
  if (durUnitHint === 'auto' && idxDuration >= 0) {
    const nums = dataRows
      .map(r => (r[idxDuration] || '').trim())
      .filter(v => /^\d+$/.test(v))
      .map(v => parseInt(v, 10));
    if (nums.length > 0) {
      const largeNums = nums.filter(n => n > 60).length;
      if (largeNums >= Math.ceil(nums.length * 0.4)) {
        durUnitHint = 'seconds';
      } else {
        durUnitHint = 'minutes';
      }
    }
  }

  // Pre-compute clock start times for every row so we can infer duration = nextStart - currentStart
  const rowStartSecs: (number | null)[] = dataRows.map(row => {
    if (idxStartTime >= 0 && row[idxStartTime]) {
      return parseClockTimeOfDayToSeconds(row[idxStartTime]);
    }
    return null;
  });

  if (!plannedStartTime) {
    const firstValidStart = rowStartSecs.find(s => s !== null);
    if (firstValidStart !== null && firstValidStart !== undefined) {
      const h = Math.floor(firstValidStart / 3600);
      const m = Math.floor((firstValidStart % 3600) / 60);
      const s = firstValidStart % 60;
      plannedStartTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  const items: RundownItem[] = [];
  let autoCounter = 1;

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    if (!row || row.every(c => !c.trim())) continue;

    let rawTitle = idxTitle >= 0 && row[idxTitle] ? row[idxTitle].trim() : '';
    if (!rawTitle) {
      // Try first non-empty descriptive cell
      const alt = row.find((c, idx) => idx !== idxSeg && idx !== idxDuration && idx !== idxStartTime && idx !== idxEndTime && c.trim().length > 1);
      rawTitle = alt ? alt.trim() : '';
    }
    if (!rawTitle || isSummaryOrNoiseRow(row, rawTitle)) continue;

    // Extract inline duration if embedded in title
    const inlineFromTitle = extractInlineDuration(rawTitle);
    const title = inlineFromTitle.cleanedText || rawTitle;

    // Segment number
    const rawSeg = idxSeg >= 0 && row[idxSeg] ? row[idxSeg].trim() : '';
    const segmentNumber = rawSeg && rawSeg.length <= 10
      ? rawSeg.replace(/^\d$/, d => `0${d}`)
      : String(autoCounter).padStart(2, '0');
    autoCounter++;

    const presenter = idxPresenter >= 0 && row[idxPresenter] ? row[idxPresenter].trim() : '';

    // Merge all production/cue/camera/gfx/lighting/notes columns cleanly
    const noteParts: string[] = [];
    for (const nIdx of noteIndices) {
      const val = row[nIdx]?.trim();
      if (!val) continue;
      const colLabel = headerRow[nIdx]?.trim();
      if (noteIndices.length > 1 && colLabel && !/^(notes?|details?|remarks?)$/i.test(colLabel)) {
        noteParts.push(`[${colLabel}] ${val}`);
      } else {
        noteParts.push(val);
      }
    }
    const notes = noteParts.join(' | ');

    // Merge all audio/mic/sound/music columns cleanly
    const audioParts: string[] = [];
    for (const aIdx of audioIndices) {
      const val = row[aIdx]?.trim();
      if (!val) continue;
      const colLabel = headerRow[aIdx]?.trim();
      if (audioIndices.length > 1 && colLabel && !/^(audio|audio\s*notes?)$/i.test(colLabel)) {
        audioParts.push(`${colLabel}: ${val}`);
      } else {
        audioParts.push(val);
      }
    }
    const audioNotes = audioParts.join(' | ');

    // Status
    let statusVal: RundownItem['status'] = 'pending';
    if (idxStatus >= 0 && row[idxStatus]) {
      const s = row[idxStatus].toLowerCase();
      if (s.includes('done') || s.includes('complete')) statusVal = 'done';
      else if (s.includes('live') || s.includes('active') || s.includes('now')) statusVal = 'live';
      else if (s.includes('cue') || s.includes('next') || s.includes('armed')) statusVal = 'cue';
      else if (s.includes('skip')) statusVal = 'skipped';
    }

    // Duration calculation cascade
    let durationSec = 0;

    // A) Split Min + Sec columns
    if (idxDurationMin >= 0 || idxDurationSec >= 0) {
      const m = idxDurationMin >= 0 ? parseFloat(row[idxDurationMin] || '0') || 0 : 0;
      const s = idxDurationSec >= 0 ? parseFloat(row[idxDurationSec] || '0') || 0 : 0;
      if (m > 0 || s > 0) {
        durationSec = Math.round(m * 60 + s);
      }
    }

    // B) Primary Duration column
    if (durationSec <= 0 && idxDuration >= 0 && row[idxDuration]) {
      durationSec = parseFlexibleDuration(row[idxDuration], durUnitHint);
    }

    // C) Start & End clock difference
    const rowStart = rowStartSecs[r];
    if (durationSec <= 0 && rowStart !== null && idxEndTime >= 0 && row[idxEndTime]) {
      const rowEnd = parseClockTimeOfDayToSeconds(row[idxEndTime]);
      if (rowEnd !== null) {
        let diff = rowEnd - rowStart;
        if (diff <= 0) diff += 86400;
        if (diff > 0 && diff <= 43200) durationSec = diff;
      }
    }

    // D) Inline duration from title
    if (durationSec <= 0 && inlineFromTitle.seconds > 0) {
      durationSec = inlineFromTitle.seconds;
    }

    // E) Next row's Start Time minus Current row's Start Time
    if (durationSec <= 0 && rowStart !== null) {
      for (let nr = r + 1; nr < dataRows.length; nr++) {
        const nextStart = rowStartSecs[nr];
        if (nextStart !== null) {
          let diff = nextStart - rowStart;
          if (diff <= 0) diff += 86400;
          if (diff > 0 && diff <= 43200) {
            durationSec = diff;
          }
          break;
        }
      }
    }

    // F) Scan any unclassified cell on this row for a standalone time pattern
    if (durationSec <= 0) {
      for (let c = 0; c < row.length; c++) {
        if (c === idxTitle || c === idxSeg || c === idxStartTime || c === idxEndTime) continue;
        const val = row[c]?.trim();
        if (val && (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(val) || /^\d+(?:\.\d+)?\s*(?:m|min|mins|s|sec)$/i.test(val))) {
          const d = parseFlexibleDuration(val, 'auto');
          if (d >= 10) {
            durationSec = d;
            break;
          }
        }
      }
    }

    if (durationSec <= 0) {
      durationSec = 180; // Safe 03:00 broadcast default if completely unspecified
    } else {
      durationSec = Math.max(5, durationSec);
    }

    // Color category resolution
    const rawCategory = idxCategory >= 0 && row[idxCategory] ? row[idxCategory].trim() : '';
    const rawColor = idxColor >= 0 && row[idxColor] ? row[idxColor].trim() : '';
    const color = rawColor
      ? resolveColorFromCategory(rawColor, title, notes)
      : resolveColorFromCategory(rawCategory, title, notes);

    items.push({
      id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 6)}`,
      segmentNumber,
      title,
      presenter,
      durationSec,
      notes,
      audioNotes,
      status: statusVal,
      color
    });
  }

  const formatNote = hasHeader
    ? `Smart Table (${bestHeaderIdx > 0 ? `Header detected at row ${bestHeaderIdx + 1}` : 'Column Auto-Mapped'})`
    : 'Smart Headerless Table Inference';

  return {
    items,
    detectedFormat: formatNote,
    showTitle,
    plannedStartTime,
    warnings,
    engine: 'local-smart'
  };
}

/**
 * Picks the best worksheet in a multi-sheet Excel workbook (skips Cover/Instructions sheets).
 */
export function pickBestWorksheet(wb: XLSX.WorkBook): string {
  if (!wb.SheetNames || wb.SheetNames.length === 0) return '';
  if (wb.SheetNames.length === 1) return wb.SheetNames[0];

  let bestName = wb.SheetNames[0];
  let bestScore = -1;

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false, raw: false });
    const res = smartParseSpreadsheetRows(rows.map(r => r.map(c => String(c ?? ''))));
    let score = res.items.length * 2;
    if (/rundown|running\s*order|ros|schedule|show\s*flow|program|cue\s*sheet/i.test(name)) {
      score += 20;
    }
    if (/cover|instruction|guide|legend|readme/i.test(name)) {
      score -= 10;
    }
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }

  return bestName;
}

/**
 * Parses unstructured / free-text / bulleted / scripted running orders from emails, WhatsApp, Word, PDF copy-paste, etc.
 */
export function smartParseFreeText(rawText: string): SmartExtractResult {
  const warnings: string[] = [];
  const text = rawText.replace(/^\uFEFF/, '').trim();
  if (!text) {
    return { items: [], detectedFormat: 'Empty Text', warnings: ['No text provided'], engine: 'local-smart' };
  }

  // 1. Check if JSON
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.items)
        ? parsed.items
        : Array.isArray(parsed.segments)
        ? parsed.segments
        : Array.isArray(parsed.rundown)
        ? parsed.rundown
        : null;
      if (arr && arr.length > 0) {
        const items: RundownItem[] = arr.map((obj: any, idx: number) => {
          const title = String(obj.title || obj.name || obj.segment || obj.topic || obj.activity || `Segment ${idx + 1}`).trim();
          const durRaw = obj.durationSec ?? obj.duration ?? obj.dur ?? obj.length ?? obj.runtime ?? obj.seconds ?? (obj.minutes ? Number(obj.minutes) * 60 : undefined);
          const durationSec = durRaw !== undefined ? Math.max(5, parseFlexibleDuration(durRaw, 'seconds')) : 180;
          const notes = String(obj.notes || obj.cues || obj.cue || obj.tech || obj.details || '').trim();
          const audioNotes = String(obj.audioNotes || obj.audio || obj.sound || obj.mic || '').trim();
          const presenter = String(obj.presenter || obj.speaker || obj.talent || obj.host || obj.lead || '').trim();
          const color = resolveColorFromCategory(obj.color || obj.category || obj.type, title, notes);
          return {
            id: `item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            segmentNumber: String(obj.segmentNumber || obj.seg || obj.number || idx + 1).padStart(2, '0'),
            title,
            presenter,
            durationSec: durationSec || 180,
            notes,
            audioNotes,
            status: 'pending',
            color
          };
        });
        return {
          items,
          detectedFormat: 'JSON Running Order',
          showTitle: parsed.title || parsed.showTitle,
          plannedStartTime: parsed.plannedStartTime,
          warnings,
          engine: 'local-smart'
        };
      }
    } catch {
      // Not valid JSON, continue
    }
  }

  // 2. Check if HTML table
  if (/<table[\s>]/i.test(text) && /<tr[\s>]/i.test(text)) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const tableRows = Array.from(doc.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('th, td')).map(td => (td.textContent || '').replace(/\s+/g, ' ').trim())
      ).filter(r => r.some(Boolean));
      if (tableRows.length >= 2) {
        const res = smartParseSpreadsheetRows(tableRows);
        if (res.items.length > 0) {
          return { ...res, detectedFormat: 'HTML Table Extraction' };
        }
      }
    } catch {
      // fallback
    }
  }

  // 3. Try delimited / structured table parsing first if lines look columnar
  const { rows, delimiter } = parseSmartDelimited(text);
  const colCounts = rows.map(r => r.length);
  const multiColCount = colCounts.filter(c => c >= 3).length;
  if (rows.length >= 2 && multiColCount >= Math.max(2, Math.floor(rows.length * 0.5))) {
    const tableRes = smartParseSpreadsheetRows(rows);
    if (tableRes.items.length > 0) {
      return {
        ...tableRes,
        detectedFormat: delimiter === '\t'
          ? 'Tab-Separated Table (TSV)'
          : delimiter === '|'
          ? 'Markdown / Pipe Table'
          : delimiter === ';'
          ? 'Semicolon-Separated Spreadsheet'
          : delimiter === 'spaces'
          ? 'Space-Aligned Table'
          : tableRes.detectedFormat
      };
    }
  }

  // 4. Key-Value Multi-Line Block Parser
  // Detects blocks like:
  //   Segment 1: Welcome
  //   Duration: 5m
  //   Presenter: John
  //   Audio: Mic 1
  if (/^(?:title|segment|item|duration|dur|presenter|speaker|notes?|cues?|audio)\s*:/im.test(text)) {
    const blocks = text.split(/\r?\n\s*\r?\n|---+/).filter(b => b.trim());
    const blockItems: RundownItem[] = [];
    for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
      const lines = blocks[bIdx].split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      let title = '';
      let durationSec = 0;
      let presenter = '';
      let notes = '';
      let audioNotes = '';
      let category = '';

      for (const line of lines) {
        const kv = line.match(/^([a-z0-9\s#/_-]+?)\s*:\s*(.+)$/i);
        if (!kv) {
          if (!title) title = line.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, '').trim();
          continue;
        }
        const k = kv[1].toLowerCase().trim();
        const v = kv[2].trim();
        if (/^(title|segment\s*\d*|item\s*\d*|topic|name|seg\s*\d*)$/i.test(k)) {
          title = v;
        } else if (/^(duration|dur|time|length|runtime)$/i.test(k)) {
          durationSec = parseFlexibleDuration(v, 'auto');
        } else if (/^(presenter|speaker|host|talent|by|who|mc)$/i.test(k)) {
          presenter = v;
        } else if (/^(audio|audio\s*notes?|mic|mics|sound|music|sfx)$/i.test(k)) {
          audioNotes = audioNotes ? `${audioNotes} | ${v}` : v;
        } else if (/^(category|type|color)$/i.test(k)) {
          category = v;
        } else if (/^(notes?|cues?|cue|cam|camera|gfx|graphics|lighting|tech|video|stage|details?)$/i.test(k)) {
          const prefix = /^(notes?|details?)$/i.test(k) ? '' : `[${kv[1].trim()}] `;
          notes = notes ? `${notes} | ${prefix}${v}` : `${prefix}${v}`;
        }
      }

      if (title) {
        const inline = extractInlineDuration(title);
        if (durationSec <= 0 && inline.seconds > 0) durationSec = inline.seconds;
        blockItems.push({
          id: `item-${Date.now()}-${bIdx}-${Math.random().toString(36).slice(2, 6)}`,
          segmentNumber: String(blockItems.length + 1).padStart(2, '0'),
          title: inline.cleanedText || title,
          presenter,
          durationSec: durationSec > 0 ? durationSec : 180,
          notes,
          audioNotes,
          status: 'pending',
          color: resolveColorFromCategory(category, title, notes)
        });
      }
    }
    if (blockItems.length >= 2 || (blockItems.length === 1 && (blockItems[0].durationSec !== 180 || blockItems[0].notes || blockItems[0].presenter))) {
      return {
        items: blockItems,
        detectedFormat: 'Multi-Line Key-Value Cue Sheet',
        warnings,
        engine: 'local-smart'
      };
    }
  }

  // 5. Free-Text Line-by-Line Intelligent Schedule & Cue Extractor
  // Handles lines like:
  //   "09:00 - 09:15: Opening Keynote (Dr. Vance) - Stage wash [Audio: Headset 1]"
  //   "1. Cold Open | 02:30 | Host | Cam 1"
  //   "• Music Set (15 mins) — Full band"
  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const docHasAmPmOr24h = rawLines.some(l => /\b(?:am|pm)\b/i.test(l) || /\b(?:1[3-9]|2[0-3]):\d{2}\b/.test(l) || /\b\d{1,2}:\d{2}:\d{2}\b/.test(l));
  const docHasZeroElapsed = !docHasAmPmOr24h && rawLines.some(l => /(?:^|[\s|(-])00:\d{2}\b/.test(l));

  // Detect if multiple lines start with monotonic clock times (e.g., "09:00 | Doors", "09:15 | Welcome")
  const leadingSingleTimes = rawLines
    .map(l => {
      const m = l.match(/^(?:(?:\d+[.)]\s*|[-*•►▸]\s*))?(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*[:|\-–—]\s+/i);
      return m ? parseClockTimeOfDayToSeconds(m[1]) : null;
    })
    .filter((v): v is number => v !== null);
  const looksLikeMonotonicClockSchedule =
    leadingSingleTimes.length >= 2 &&
    leadingSingleTimes.every((t, idx) => idx === 0 || t > leadingSingleTimes[idx - 1]) &&
    (leadingSingleTimes[0] >= 6 * 3600 || docHasAmPmOr24h);

  const extractedLines: Array<{
    segNum?: string;
    startSec: number | null;
    endSec: number | null;
    durSec: number;
    title: string;
    presenter: string;
    notes: string;
    audioNotes: string;
  }> = [];

  let detectedShowTitle: string | undefined;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    if (/^[-=_*]{3,}$/.test(line)) continue;
    if (/^(total|grand\s*total|end\s*of\s*show|end\s*of\s*rundown)\b/i.test(line)) continue;

    // Check if first line is just a show banner without time/bullet
    if (i === 0 && rawLines.length > 2 && !/\d{1,2}:\d{2}|\d+\s*(?:m|min|s|sec)\b|^\d+[.)]\s/i.test(line)) {
      detectedShowTitle = line.replace(/^#+\s*/, '').trim();
      continue;
    }

    // Extract inline tagged brackets like [Audio: ...] [GFX: ...] [Cam: ...]
    let audioNotes = '';
    const extraNotes: string[] = [];
    line = line.replace(/\[([^\]]+)\]/g, (full, inner: string) => {
      const tagMatch = inner.match(/^(audio|mic|sound|music|sfx)\s*[:\-]\s*(.+)$/i);
      if (tagMatch) {
        audioNotes = audioNotes ? `${audioNotes} | ${tagMatch[2].trim()}` : tagMatch[2].trim();
        return '';
      }
      const cueTag = inner.match(/^(gfx|graphics|cam|camera|lx|lighting|vt|video|cue|notes?|stage)\s*[:\-]\s*(.+)$/i);
      if (cueTag) {
        extraNotes.push(`[${cueTag[1].toUpperCase()}] ${cueTag[2].trim()}`);
        return '';
      }
      const inlineD = parseFlexibleDuration(inner.trim(), 'auto');
      if (inlineD >= 5 && /^\d/.test(inner.trim())) {
        return `(${inner.trim()})`; // normalize to parentheses for unified extraction
      }
      return full;
    }).replace(/\s*[-–—|]+\s*$/, '').trim();

    // Strip markdown bullet or numbered prefix
    let segNum: string | undefined;
    const prefixMatch = line.match(/^(?:(?:seg(?:ment)?|item|cue|#)\s*)?(\d{1,3})\s*[.):\-]\s+(.+)$/i);
    if (prefixMatch && !/^\d{1,2}:\d{2}/.test(line)) {
      segNum = prefixMatch[1].padStart(2, '0');
      line = prefixMatch[2].trim();
    } else {
      line = line.replace(/^[-*•►▸]\s+/, '').trim();
    }

    let startSec: number | null = null;
    let endSec: number | null = null;
    let durSec = 0;

    // Detect leading time range "09:00 - 09:15", "9:00 AM - 9:30 AM", or cumulative "00:00 - 01:30"
    const leadRange = line.match(
      /^(\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*[:|\-–—]?\s*(.+)$/i
    );
    if (leadRange) {
      const r1 = leadRange[1].trim();
      const r2 = leadRange[2].trim();
      const isCumulativeMmSs =
        docHasZeroElapsed &&
        !/am|pm/i.test(r1 + r2) &&
        r1.split(':').length === 2 &&
        r2.split(':').length === 2;

      if (isCumulativeMmSs) {
        const d1 = parseFlexibleDuration(r1, 'seconds');
        const d2 = parseFlexibleDuration(r2, 'seconds');
        if (d2 > d1) durSec = d2 - d1;
      } else {
        startSec = parseClockTimeOfDayToSeconds(r1);
        endSec = parseClockTimeOfDayToSeconds(r2);
        if (startSec !== null && endSec !== null) {
          let d = endSec - startSec;
          if (d <= 0) d += 86400;
          if (d > 0 && d <= 43200) durSec = d;
        }
      }
      line = leadRange[3].trim();
    } else {
      // Detect single leading clock time or duration "09:00 | Keynote" or "05:00 - Intro"
      const leadSingleTime = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*[:|\-–—]\s*(.+)$/i);
      if (leadSingleTime) {
        const rawT = leadSingleTime[1].trim();
        const asClock = parseClockTimeOfDayToSeconds(rawT);
        if (/am|pm/i.test(rawT) || looksLikeMonotonicClockSchedule) {
          startSec = asClock;
        } else {
          durSec = parseFlexibleDuration(rawT, 'auto');
        }
        line = leadSingleTime[2].trim();
      }
    }

    // Extract inline duration anywhere in line: (5 mins), (03:30), (3'30"), — 10 min, - 45s
    if (durSec <= 0) {
      const inlineDur = extractInlineDuration(line);
      if (inlineDur.seconds > 0) {
        durSec = inlineDur.seconds;
        line = inlineDur.cleanedText;
      } else {
        const dashDur = line.match(
          /\s+[-–—|]\s+(\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?|s|sec|secs|seconds?)|(?:\d{1,2}:\d{2}(?::\d{2})?))(?=\s|$)/i
        );
        if (dashDur) {
          const parsedD = parseFlexibleDuration(dashDur[1], 'auto');
          if (parsedD >= 5) {
            durSec = parsedD;
            line = line.replace(dashDur[0], '').replace(/\s{2,}/g, ' ').trim();
          }
        }
      }
    }

    // Split remaining line by pipe `|`, em-dash `—`, ` - `, or semicolon `;` into Title / Presenter / Notes
    const parts = line
      .split(/\s+\|\s+|\s+[—–]\s+|\s+-\s+|;\s+/)
      .map(p => p.trim())
      .filter(Boolean);

    let title = parts[0] || line;
    let presenter = '';
    const notesParts = [...extraNotes];

    // Check if presenter is inside parentheses at end of title e.g. "Opening Keynote (Pastor John)"
    const parenPresenter = title.match(/^(.+?)\s*\(([^()]{2,35})\)$/);
    if (parenPresenter && !/\d/.test(parenPresenter[2])) {
      title = parenPresenter[1].trim();
      presenter = parenPresenter[2].trim();
    }

    for (let p = 1; p < parts.length; p++) {
      const seg = parts[p];
      if (/^(?:audio|mic|mics|sound|music|sfx)\s*:/i.test(seg)) {
        const val = seg.replace(/^(?:audio|mic|mics|sound|music|sfx)\s*:\s*/i, '').trim();
        audioNotes = audioNotes ? `${audioNotes} | ${val}` : val;
      } else if (/^(?:by|host|speaker|presenter|talent|mc|lead)\s*:/i.test(seg)) {
        presenter = seg.replace(/^(?:by|host|speaker|presenter|talent|mc|lead)\s*:\s*/i, '').trim();
      } else if (
        !presenter &&
        p === 1 &&
        seg.length <= 32 &&
        !/\b(cam|gfx|slide|roll|reel|auto|automated|lights?|stage|screen|mic|cue|video|vt|playback|music|track|loop|slate|banner|lower)\b/i.test(seg)
      ) {
        presenter = seg;
      } else {
        notesParts.push(seg);
      }
    }

    if (!title) continue;

    extractedLines.push({
      segNum,
      startSec,
      endSec,
      durSec,
      title,
      presenter,
      notes: notesParts.join(' | '),
      audioNotes
    });
  }

  // Infer missing durations from adjacent start times in free text!
  for (let i = 0; i < extractedLines.length; i++) {
    const cur = extractedLines[i];
    if (cur.durSec <= 0 && cur.startSec !== null && i + 1 < extractedLines.length && extractedLines[i + 1].startSec !== null) {
      let diff = extractedLines[i + 1].startSec! - cur.startSec;
      if (diff <= 0) diff += 86400;
      if (diff > 0 && diff <= 43200) cur.durSec = diff;
    }
  }

  const items: RundownItem[] = extractedLines.map((e, idx) => ({
    id: `item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    segmentNumber: e.segNum || String(idx + 1).padStart(2, '0'),
    title: e.title,
    presenter: e.presenter,
    durationSec: e.durSec > 0 ? Math.max(5, e.durSec) : 180,
    notes: e.notes,
    audioNotes: e.audioNotes,
    status: 'pending',
    color: resolveColorFromCategory(undefined, e.title, e.notes)
  }));

  let plannedStartTime: string | undefined;
  const firstStart = extractedLines.find(e => e.startSec !== null)?.startSec;
  if (firstStart !== null && firstStart !== undefined) {
    const h = Math.floor(firstStart / 3600);
    const m = Math.floor((firstStart % 3600) / 60);
    const s = firstStart % 60;
    plannedStartTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return {
    items,
    detectedFormat: items.length > 0 ? 'Smart Free-Text Schedule & Cues' : 'Unrecognized Format',
    showTitle: detectedShowTitle,
    plannedStartTime,
    warnings,
    engine: 'local-smart'
  };
}

/**
 * Strips RTF control words to extract readable plain text offline.
 */
function stripRtfToText(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\{\\[^{}]*\}/g, '')
    .replace(/\\[a-z]+\-?\d*\s?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\r?\n{2,}/g, '\n')
    .trim();
}

/**
 * Zero-dependency browser/APK ZIP extractor for word/document.xml inside .docx files.
 */
async function extractDocxXmlOffline(buffer: ArrayBuffer): Promise<string | null> {
  try {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let offset = 0;

    while (offset + 30 < bytes.length) {
      // Local file header signature: 0x04034b50
      if (view.getUint32(offset, true) !== 0x04034b50) break;
      const compressionMethod = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const fileNameLen = view.getUint16(offset + 26, true);
      const extraFieldLen = view.getUint16(offset + 28, true);

      const nameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLen);
      const fileName = new TextDecoder().decode(nameBytes);
      const dataStart = offset + 30 + fileNameLen + extraFieldLen;
      const dataEnd = dataStart + compressedSize;

      if (fileName === 'word/document.xml') {
        const compSlice = bytes.slice(dataStart, dataEnd);
        if (compressionMethod === 0) {
          return new TextDecoder('utf-8').decode(compSlice);
        }
        if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate-raw');
          const stream = new Blob([compSlice]).stream().pipeThrough(ds);
          return await new Response(stream).text();
        }
        return null;
      }

      if (compressedSize === 0 && (view.getUint16(offset + 6, true) & 0x08)) {
        // Data descriptor present without known size: bail safely
        break;
      }
      offset = dataEnd;
    }
  } catch {
    return null;
  }
  return null;
}

function parseDocxXmlToExtractResult(xmlString: string): SmartExtractResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Check for Word tables (<w:tbl>) first!
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  let bestTableItems: RundownItem[] = [];
  let bestResult: SmartExtractResult | null = null;

  for (const tbl of tables) {
    const trs = Array.from(tbl.getElementsByTagName('w:tr'));
    const matrix: string[][] = trs.map(tr => {
      const tcs = Array.from(tr.getElementsByTagName('w:tc'));
      return tcs.map(tc => {
        const texts = Array.from(tc.getElementsByTagName('w:t')).map(t => t.textContent || '');
        return texts.join('').replace(/\s+/g, ' ').trim();
      });
    }).filter(r => r.some(Boolean));

    if (matrix.length >= 2) {
      const res = smartParseSpreadsheetRows(matrix);
      if (res.items.length > bestTableItems.length) {
        bestTableItems = res.items;
        bestResult = { ...res, detectedFormat: 'Word Document Table (.docx)' };
      }
    }
  }

  if (bestResult && bestTableItems.length > 0) {
    return bestResult;
  }

  // Otherwise extract paragraphs
  const paragraphs = Array.from(doc.getElementsByTagName('w:p'))
    .map(p => Array.from(p.getElementsByTagName('w:t')).map(t => t.textContent || '').join('').trim())
    .filter(Boolean);

  const res = smartParseFreeText(paragraphs.join('\n'));
  return { ...res, detectedFormat: 'Word Document Text (.docx)' };
}

/**
 * Universal Entry Point for Files (works 100% offline in APK + Web, with optional online AI fallback for PDFs/Images).
 */
export async function smartExtractFromFile(
  file: File,
  options?: { apiBaseUrl?: string; preferAi?: boolean }
): Promise<{ result: SmartExtractResult; workbook?: XLSX.WorkBook; sheetNames?: string[]; selectedSheet?: string; rawTextPreview?: string }> {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop() || '';
  const apiBase = options?.apiBaseUrl;

  // 1. Spreadsheet formats via SheetJS (.xlsx, .xls, .xlsm, .xlsb, .ods, .numbers)
  if (['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      throw new Error('No worksheets found in this workbook.');
    }
    const bestSheet = pickBestWorksheet(wb);
    const ws = wb.Sheets[bestSheet];
    const stringRows = sheetTo2DStringArray(ws, XLSX);
    const result = smartParseSpreadsheetRows(stringRows);
    return {
      result: {
        ...result,
        detectedFormat: `${ext.toUpperCase()} Workbook (${bestSheet})`
      },
      workbook: wb,
      sheetNames: wb.SheetNames,
      selectedSheet: bestSheet
    };
  }

  // 2. Word .docx (100% offline ZIP+XML extraction, optional AI fallback if online)
  if (ext === 'docx') {
    const buffer = await file.arrayBuffer();
    const xml = await extractDocxXmlOffline(buffer);
    if (xml) {
      const result = parseDocxXmlToExtractResult(xml);
      if (result.items.length > 0) {
        return { result };
      }
    }
    throw new Error('Could not find running order rows in this .docx file. Try saving as .xlsx, .csv, or pasting the text.');
  }

  // 3. PDF or Image (Photo/Screenshot of a printed running order) -> uses Server AI if online
  const isImageOrPdf = ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext) || file.type.startsWith('image/') || file.type === 'application/pdf';
  if (isImageOrPdf) {
    if (!apiBase) {
      throw new Error('PDF & photo running order extraction requires an online connection. Offline APK supports .xlsx, .xls, .csv, .tsv, .docx, .html, .json & .txt files.');
    }
    const aiResult = await smartExtractWithGeminiApi(apiBase, { file });
    return { result: aiResult };
  }

  // 4. Text / CSV / TSV / HTML / RTF / Markdown / JSON
  const rawText = await file.text();
  const normalizedText = ext === 'rtf' || rawText.trimStart().startsWith('{\\rtf')
    ? stripRtfToText(rawText)
    : rawText;

  if (options?.preferAi && apiBase) {
    try {
      const aiResult = await smartExtractWithGeminiApi(apiBase, { text: normalizedText, fileName: file.name });
      if (aiResult.items.length > 0) {
        return { result: aiResult, rawTextPreview: normalizedText };
      }
    } catch {
      // Fall through to local smart parser if AI call fails
    }
  }

  const localResult = smartParseFreeText(normalizedText);
  return { result: localResult, rawTextPreview: normalizedText };
}

/**
 * Calls server-side /api/smart-extract powered by Gemini AI (Online Web mode only).
 */
export async function smartExtractWithGeminiApi(
  apiBaseUrl: string,
  payload: { text?: string; file?: File; fileName?: string }
): Promise<SmartExtractResult> {
  let body: any = {};

  if (payload.file) {
    const buf = await payload.file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    body = {
      fileName: payload.file.name,
      mimeType: payload.file.type || (payload.file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
      fileBase64: base64
    };
  } else {
    body = {
      fileName: payload.fileName || 'pasted-running-order.txt',
      text: payload.text || ''
    };
  }

  const res = await fetch(`${apiBaseUrl}/api/smart-extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `AI extraction failed (HTTP ${res.status})`);
  }

  const rawItems: any[] = Array.isArray(data.items) ? data.items : [];
  const items: RundownItem[] = rawItems.map((it, idx) => {
    const title = String(it.title || `Segment ${idx + 1}`).trim();
    const notes = String(it.notes || '').trim();
    const color = resolveColorFromCategory(it.color || it.category, title, notes);
    return {
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      segmentNumber: String(it.segmentNumber || idx + 1).padStart(2, '0'),
      title,
      presenter: String(it.presenter || '').trim(),
      durationSec: Math.max(5, Math.round(Number(it.durationSec) || 180)),
      notes,
      audioNotes: String(it.audioNotes || '').trim(),
      status: ['pending', 'cue', 'live', 'done', 'skipped'].includes(it.status) ? it.status : 'pending',
      color
    };
  });

  return {
    items,
    detectedFormat: 'Gemini AI Smart Extraction',
    showTitle: data.showTitle,
    plannedStartTime: data.plannedStartTime,
    warnings: [],
    engine: 'gemini-ai'
  };
}

/**
 * Extracts 2D string matrix from an XLSX worksheet combining formatted text (w) and raw values (v)
 */
export function sheetTo2DStringArray(worksheet: any, xlsxModule: any): string[][] {
  if (!worksheet || !xlsxModule) return [];

  const formattedRows: any[][] = xlsxModule.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false
  });

  const rawRows: any[][] = xlsxModule.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true
  });

  const finalRows: string[][] = [];
  const maxRows = Math.max(formattedRows.length, rawRows.length);

  for (let r = 0; r < maxRows; r++) {
    const fRow = formattedRows[r] || [];
    const rRow = rawRows[r] || [];
    const maxCols = Math.max(fRow.length, rRow.length);
    const rowCells: string[] = [];

    for (let c = 0; c < maxCols; c++) {
      const fVal = String(fRow[c] ?? '').trim();
      const rVal = rRow[c];

      // Preserve precise float serial if formatted string truncated to "12:00 AM" or similar weirdness,
      // otherwise prefer Excel formatted string (e.g. "05:00", "9:15 AM")
      if (fVal && fVal !== 'NaN' && fVal !== 'null' && fVal !== 'undefined') {
        rowCells.push(fVal);
      } else if (rVal !== undefined && rVal !== null && rVal !== '') {
        rowCells.push(String(rVal).trim());
      } else {
        rowCells.push('');
      }
    }

    if (rowCells.some(cell => cell.length > 0)) {
      finalRows.push(rowCells);
    }
  }

  return finalRows;
}

export function formatRuntimeSummary(items: RundownItem[]): string {
  const total = items.reduce((sum, it) => sum + (it.durationSec || 0), 0);
  return formatTime(total, true);
}
