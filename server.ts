import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse CLI --port argument or default to port 3000 (or process.env.PORT in production)
const args = process.argv.slice(2);
let cliPort: number | null = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    const parsed = parseInt(args[i + 1], 10);
    if (!Number.isNaN(parsed)) {
      cliPort = parsed;
    }
    break;
  }
}
const isProduction = process.env.NODE_ENV === 'production';
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
const PRIMARY_PORT = cliPort ?? (isProduction && envPort ? envPort : 3000);
const ALT_PORT =
  !cliPort && envPort && envPort !== PRIMARY_PORT
    ? envPort
    : !cliPort && isProduction && PRIMARY_PORT !== 3000
      ? 3000
      : null;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for all incoming API requests (allows Android APK and external talent displays)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

export interface RundownItem {
  id: string;
  segmentNumber: string;
  title: string;
  presenter: string;
  durationSec: number;
  plannedStartTime?: string;
  notes: string;
  audioNotes: string;
  status: 'pending' | 'cue' | 'live' | 'done' | 'skipped';
}

export interface SessionState {
  id: string;
  title: string;
  plannedStartTime: string; // "19:00:00"
  googleSheetUrl: string;
  autoSyncSheet: boolean;
  syncIntervalSec: number;
  lastSyncedAt?: number;
  items: RundownItem[];
  isDefault?: boolean;
  timer: {
    activeItemIndex: number;
    isRunning: boolean;
    timeRemaining: number;
    duration: number;
    isOvertime: boolean;
    startedAt: number | null; // epoch timestamp
    pausedAt: number | null;
    elapsedInSegment: number;
    showStartTime: number | null;
    autoAdvance: boolean;
    flashAlert: boolean;
  };
  updatedAt: number;
}

// In-memory sessions store
const sessions = new Map<string, SessionState>();
// Active SSE clients mapped by sessionId
const sseClients = new Map<string, Set<Response>>();

// Disk persistence for sessions so server restarts never lose sheets/excel presets
const DATA_DIR = path.resolve(__dirname, 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedSessions() {
  try {
    ensureDataDir();
    if (fs.existsSync(SESSIONS_FILE)) {
      const content = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        for (const [id, session] of parsed) {
          sessions.set(id, session);
        }
        console.log(`Loaded ${sessions.size} persisted sessions from disk.`);
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted sessions from disk:', err);
  }
}

function savePersistedSessions() {
  try {
    ensureDataDir();
    const data = JSON.stringify(Array.from(sessions.entries()), null, 2);
    fs.writeFileSync(SESSIONS_FILE, data, 'utf-8');
  } catch (err) {
    console.error('Failed to save sessions to disk:', err);
  }
}

// Load existing persisted sessions on startup
loadPersistedSessions();

// Default initial items
const DEFAULT_ITEMS: RundownItem[] = [
  {
    id: 'seg-1',
    segmentNumber: '01',
    title: 'Pre-Show & Countdown VT',
    presenter: 'Control Room',
    durationSec: 180,
    notes: 'Roll promo reel, check video wall',
    audioNotes: 'Background theme music',
    status: 'pending'
  },
  {
    id: 'seg-2',
    segmentNumber: '02',
    title: 'Show Intro & Cold Open',
    presenter: 'Main Host',
    durationSec: 120,
    notes: 'Camera 1 direct to lens',
    audioNotes: 'Host mic live',
    status: 'pending'
  },
  {
    id: 'seg-3',
    segmentNumber: '03',
    title: 'Opening Remarks & Rundown Overview',
    presenter: 'Host & Co-Host',
    durationSec: 240,
    notes: 'Introduce live stream guests, poll audience in chat',
    audioNotes: 'Host & co-host mics open',
    status: 'pending'
  },
  {
    id: 'seg-4',
    segmentNumber: '04',
    title: 'Keynote Feature: Live Demo',
    presenter: 'Product Lead (Marcus)',
    durationSec: 600,
    notes: 'Switch to Screen Share feed',
    audioNotes: 'Laptop audio + Marcus headset',
    status: 'pending'
  },
  {
    id: 'seg-5',
    segmentNumber: '05',
    title: 'Sponsor Message & Commercial VT',
    presenter: 'VT Roll',
    durationSec: 60,
    notes: 'Play pre-recorded sponsor spot 1080p',
    audioNotes: 'Commercial video audio',
    status: 'pending'
  },
  {
    id: 'seg-6',
    segmentNumber: '06',
    title: 'Audience Q&A & Community Spotlight',
    presenter: 'Panel',
    durationSec: 420,
    notes: 'Display top 3 questions on floor teleprompter',
    audioNotes: 'Panel & audience mics',
    status: 'pending'
  },
  {
    id: 'seg-7',
    segmentNumber: '07',
    title: 'Closing Announcements & Credits',
    presenter: 'Main Host',
    durationSec: 180,
    notes: 'Plug next week episode, roll credits, fade to black',
    audioNotes: 'Host mic + outro music',
    status: 'pending'
  }
];

function getOrCreateSession(id: string): SessionState {
  if (!sessions.has(id)) {
    const now = new Date();
    const plannedStart = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const newSession: SessionState = {
      id,
      title: id === 'main' ? "Cyril Walucho's Rundown Live Free" : `Cyril's Rundown - ${id.toUpperCase()}`,
      plannedStartTime: plannedStart,
      googleSheetUrl: '',
      autoSyncSheet: false,
      syncIntervalSec: 15,
      isDefault: true,
      items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
      timer: {
        activeItemIndex: 0,
        isRunning: false,
        timeRemaining: DEFAULT_ITEMS[0].durationSec,
        duration: DEFAULT_ITEMS[0].durationSec,
        isOvertime: false,
        startedAt: null,
        pausedAt: null,
        elapsedInSegment: 0,
        showStartTime: null,
        autoAdvance: false,
        flashAlert: false
      },
      updatedAt: Date.now()
    };
    sessions.set(id, newSession);
    savePersistedSessions();
  }
  return sessions.get(id)!;
}

function broadcastSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const clients = sseClients.get(sessionId);
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify({ type: 'SYNC', session });
  for (const client of clients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      clients.delete(client);
    }
  }
}

// REST API Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// In-memory profiles store
const serverProfiles = new Map<string, any>();

// Initialize with default profile
serverProfiles.set('profile-broadcast-main', {
  id: 'profile-broadcast-main',
  name: "Cyril Walucho's Prime Time Live",
  description: "Multi-segment live broadcast show with VT rolls, live demos, sponsor spots, and audience Q&A.",
  category: 'broadcast',
  plannedStartTime: '19:00:00',
  items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Get all profiles
app.get('/api/profiles', (_req: Request, res: Response) => {
  res.json(Array.from(serverProfiles.values()));
});

// Save / Upsert profile
app.post('/api/profiles', (req: Request, res: Response) => {
  const profile = req.body;
  if (!profile || !profile.id) {
    res.status(400).json({ error: 'Profile must have an ID' });
    return;
  }
  profile.updatedAt = Date.now();
  serverProfiles.set(profile.id, profile);
  res.json({ success: true, profile, profiles: Array.from(serverProfiles.values()) });
});

// Delete profile
app.delete('/api/profiles/:id', (req: Request, res: Response) => {
  serverProfiles.delete(req.params.id);
  res.json({ success: true, profiles: Array.from(serverProfiles.values()) });
});

// Get session state
app.get('/api/session/:id', (req: Request, res: Response) => {
  const session = getOrCreateSession(req.params.id);
  res.json(session);
});

// Update session rundown / metadata
app.post('/api/session/:id/rundown', (req: Request, res: Response) => {
  const session = getOrCreateSession(req.params.id);
  const { title, items, plannedStartTime, googleSheetUrl, autoSyncSheet, syncIntervalSec, lastSyncedAt } = req.body;

  if (title !== undefined) session.title = title;
  if (plannedStartTime !== undefined) session.plannedStartTime = plannedStartTime;
  if (googleSheetUrl !== undefined) session.googleSheetUrl = googleSheetUrl;
  if (autoSyncSheet !== undefined) session.autoSyncSheet = autoSyncSheet;
  if (syncIntervalSec !== undefined) session.syncIntervalSec = syncIntervalSec;
  if (lastSyncedAt !== undefined) session.lastSyncedAt = lastSyncedAt;

  if (Array.isArray(items)) {
    session.items = items;
    // ensure activeItemIndex is within bounds
    if (session.timer.activeItemIndex >= items.length) {
      session.timer.activeItemIndex = Math.max(0, items.length - 1);
    }
  }

  session.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : false;
  session.updatedAt = req.body.updatedAt || Date.now();
  savePersistedSessions();
  broadcastSession(session.id);
  res.json({ success: true, session });
});

  // Update timer state
app.post('/api/session/:id/timer', (req: Request, res: Response) => {
  const session = getOrCreateSession(req.params.id);
  const { action, activeItemIndex, timeRemaining, isRunning, isOvertime, duration, autoAdvance, flashAlert, showStartTime } = req.body;

  if (timeRemaining !== undefined) session.timer.timeRemaining = timeRemaining;
  if (isRunning !== undefined) session.timer.isRunning = isRunning;
  if (isOvertime !== undefined) session.timer.isOvertime = isOvertime;
  if (duration !== undefined) session.timer.duration = duration;
  if (autoAdvance !== undefined) session.timer.autoAdvance = autoAdvance;
  if (flashAlert !== undefined) session.timer.flashAlert = flashAlert;
  if (showStartTime !== undefined) session.timer.showStartTime = showStartTime;

  if (action === 'start') {
    session.timer.isRunning = true;
    session.timer.startedAt = Date.now();
    if (!session.timer.showStartTime) {
      session.timer.showStartTime = Date.now();
    }
    if (session.items[session.timer.activeItemIndex]) {
      session.items[session.timer.activeItemIndex].status = 'live';
    }
  } else if (action === 'pause') {
    session.timer.isRunning = false;
    session.timer.pausedAt = Date.now();
  } else if (action === 'reset') {
    session.timer.isRunning = false;
    if (typeof activeItemIndex === 'number' && activeItemIndex >= 0 && activeItemIndex < session.items.length) {
      session.timer.activeItemIndex = activeItemIndex;
    }
    const currentItem = session.items[session.timer.activeItemIndex];
    const dur = currentItem ? currentItem.durationSec : 180;
    session.timer.duration = dur;
    session.timer.timeRemaining = dur;
    session.timer.isOvertime = false;
  } else if (action === 'auto-advance' || action === 'jump') {
    const targetIdx = typeof activeItemIndex === 'number' ? activeItemIndex : session.timer.activeItemIndex;
    if (targetIdx >= 0 && targetIdx < session.items.length) {
      session.timer.activeItemIndex = targetIdx;
      const dur = session.items[targetIdx].durationSec;
      session.timer.duration = dur;
      session.timer.timeRemaining = dur;
      session.timer.isOvertime = false;
      session.timer.isRunning = isRunning !== undefined ? isRunning : true;
      session.items.forEach((it, idx) => {
        if (idx < targetIdx) it.status = 'done';
        else if (idx === targetIdx) it.status = session.timer.isRunning ? 'live' : 'cue';
      });
    }
  } else if (action === 'next') {
    const targetIdx = typeof activeItemIndex === 'number' ? activeItemIndex : session.timer.activeItemIndex + 1;
    if (targetIdx < session.items.length) {
      session.timer.activeItemIndex = targetIdx;
      const dur = session.items[targetIdx].durationSec;
      session.timer.duration = dur;
      session.timer.timeRemaining = dur;
      session.timer.isOvertime = false;
      session.items.forEach((it, idx) => {
        if (idx < targetIdx) it.status = 'done';
        else if (idx === targetIdx) it.status = session.timer.isRunning ? 'live' : 'cue';
      });
    }
  } else if (action === 'prev') {
    const targetIdx = typeof activeItemIndex === 'number' ? activeItemIndex : session.timer.activeItemIndex - 1;
    if (targetIdx >= 0) {
      session.timer.activeItemIndex = targetIdx;
      const dur = session.items[targetIdx].durationSec;
      session.timer.duration = dur;
      session.timer.timeRemaining = dur;
      session.timer.isOvertime = false;
      session.items.forEach((it, idx) => {
        if (idx === targetIdx) it.status = session.timer.isRunning ? 'live' : 'cue';
      });
    }
  } else if (action === 'flash') {
    session.timer.flashAlert = true;
    setTimeout(() => {
      session.timer.flashAlert = false;
      broadcastSession(session.id);
    }, 1500);
  } else {
    // No specific action or simple state sync
    if (typeof activeItemIndex === 'number' && activeItemIndex >= 0 && activeItemIndex < session.items.length) {
      session.timer.activeItemIndex = activeItemIndex;
    }
  }

  session.updatedAt = Date.now();
  savePersistedSessions();
  broadcastSession(session.id);
  res.json({ success: true, timer: session.timer, session });
});

// Server-Sent Events (SSE) for live sync across all tabs, phones, tablets, monitors
app.get('/api/session/:id/events', (req: Request, res: Response) => {
  const sessionId = req.params.id;
  getOrCreateSession(sessionId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(sessionId)) {
    sseClients.set(sessionId, new Set());
  }
  const clients = sseClients.get(sessionId)!;
  clients.add(res);

  // Send initial session payload immediately
  const initialSession = sessions.get(sessionId);
  res.write(`data: ${JSON.stringify({ type: 'INIT', session: initialSession })}\n\n`);

  // Heartbeat every 20 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

// Proxy for Google Sheets CSV to circumvent CORS
app.get('/api/proxy-sheet', async (req: Request, res: Response) => {
  const urlParam = req.query.url as string;
  if (!urlParam) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    let targetUrl = urlParam.trim();
    // Normalize Google Sheet URL to direct CSV export format
    // Pattern 1: https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID} or similar
    const gsheetMatch = targetUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (gsheetMatch) {
      const sheetId = gsheetMatch[1];
      // Check if specific gid is present
      const gidMatch = targetUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/csv, text/plain, */*'
      }
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Failed to fetch Google Sheet: HTTP ${response.status} ${response.statusText}. Make sure the sheet is shared as "Anyone with the link can view".`
      });
      return;
    }

    const csvText = await response.text();
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvText);
  } catch (err: any) {
    res.status(500).json({ error: `Network error fetching sheet: ${err.message}` });
  }
});

// Smart Running Order Extraction powered by Gemini API (handles arbitrary company formats, PDFs, images, text)
app.post('/api/smart-extract', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'Gemini AI extraction key is not configured in Settings > Secrets. Local smart extraction is still available offline.'
    });
    return;
  }

  const { text, fileBase64, mimeType, fileName } = req.body || {};
  if (!text && !fileBase64) {
    res.status(400).json({ error: 'Provide either running order text or a file payload.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are a broadcast and live-event production assistant specializing in parsing running orders, run-of-show documents, cue sheets, and schedules from any company format.
Extract every segment in chronological order accurately:
- segmentNumber: two-digit string like "01", "02", or original cue/item number
- title: clear segment or item title (do not drop the name)
- presenter: speaker, host, anchor, talent, guest, or team responsible (empty string if none)
- durationSec: exact integer duration in seconds. If only Start and End times (or sequential Start times) are provided, compute the exact difference in seconds. Default to 180 only if zero timing info exists for an item.
- category: pick the best matching color key from ONLY: "cyan" (Intro/Opener), "emerald" (Live Content), "amber" (Commercial/Break), "purple" (Interview/Guest), "blue" (Video/VT Roll), "orange" (Sponsor/Promo), "rose" (Outro/Wrap-Up), "indigo" (Music/SFX), "fuchsia" (Graphics Item / Lower Third / Chyron / Slides).
- notes: combine production, camera, lighting, stage, graphics, and script cues concisely.
- audioNotes: combine audio, microphone, music, and sound notes concisely (empty string if none).
- status: "pending" unless explicitly marked done/skipped/live.
Ignore summary/total rows (e.g., "TOTAL RUNTIME", "GRAND TOTAL").`;

    const parts: any[] = [];
    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: fileBase64
        }
      });
    }
    parts.push({
      text: text
        ? `Extract all rundown segments from this running order (${fileName || 'uploaded document'}):\n\n${String(text).slice(0, 60000)}`
        : `Extract all rundown segments from the attached running order document (${fileName || 'uploaded file'}).`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            showTitle: { type: Type.STRING, description: 'Detected show or event title if present' },
            plannedStartTime: { type: Type.STRING, description: 'Detected start time in HH:MM:SS 24-hour format if present' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  segmentNumber: { type: Type.STRING },
                  title: { type: Type.STRING },
                  presenter: { type: Type.STRING },
                  durationSec: { type: Type.INTEGER },
                  category: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  audioNotes: { type: Type.STRING },
                  status: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const rawJson = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawJson);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      res.status(422).json({ error: 'Could not extract any rundown segments from this file.' });
      return;
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini /api/smart-extract error:', err);
    res.status(500).json({ error: err?.message || 'Smart AI extraction failed' });
  }
});

// Download deployable Android APK file directly
app.get(['/download/apk', '/Cyrils-RO.apk', '/Cyril-Walucho-Rundown-Live-Free.apk'], (_req: Request, res: Response) => {
  let apkPath = path.resolve(__dirname, 'public', 'Cyrils-RO.apk');
  if (!fs.existsSync(apkPath)) {
    apkPath = path.resolve(__dirname, 'public', 'Cyril-Walucho-Rundown-Live-Free.apk');
  }
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="Cyrils-RO.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).send('APK file is compiling. Please refresh in a moment.');
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const publicPath = path.resolve(__dirname, 'public');

  // Serve static assets from public/ (manifest, icons, apk)
  app.use(express.static(publicPath));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const primaryServer = app.listen(PRIMARY_PORT, '0.0.0.0', () => {
    console.log(`OnAir Rundown & Timer server running on http://0.0.0.0:${PRIMARY_PORT}`);
  });
  primaryServer.on('error', (err) => {
    console.error(`Primary server failed on port ${PRIMARY_PORT}:`, err);
    process.exit(1);
  });

  if (ALT_PORT) {
    const altServer = app.listen(ALT_PORT, '0.0.0.0', () => {
      console.log(`OnAir Rundown & Timer server also listening on http://0.0.0.0:${ALT_PORT}`);
    });
    altServer.on('error', (err) => {
      console.warn(`Could not bind secondary port ${ALT_PORT}:`, err.message);
    });
  }
}

startServer();
