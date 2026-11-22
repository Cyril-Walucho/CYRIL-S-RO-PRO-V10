import { RundownItem } from '../types/rundown';
import { formatTime } from './timeFormat';
import {
  CATEGORY_PALETTE_MAP,
  getCategoryName,
  resolveColorFromCategory,
  parseSmartDelimited,
  smartParseSpreadsheetRows,
  sheetTo2DStringArray
} from './smartRundownExtractor';

export { CATEGORY_PALETTE_MAP, getCategoryName, resolveColorFromCategory, sheetTo2DStringArray };

/**
 * Smart RFC4180 CSV/TSV/semicolon/pipe parser that auto-detects delimiters and handles quotes/newlines
 */
export function parseCSV(text: string): string[][] {
  return parseSmartDelimited(text).rows;
}

/**
 * Converts 2D array of spreadsheet rows into structured RundownItem array using smart header & time detection
 */
export function csvToRundownItems(rows: string[][]): RundownItem[] {
  return smartParseSpreadsheetRows(rows).items;
}

/**
 * Serializes rundown items to CSV format including Category and Color Stripe
 */
export function rundownToCSV(items: RundownItem[]): string {
  const headers = ['Segment #', 'Title', 'Category', 'Color Stripe', 'Presenter', 'Duration', 'Notes', 'Audio Note', 'Status'];
  const rows = [headers.join(',')];

  for (const item of items) {
    const seg = escapeCsvCell(item.segmentNumber);
    const title = escapeCsvCell(item.title);
    const category = escapeCsvCell(getCategoryName(item.color));
    const colorStripe = escapeCsvCell(item.color || 'emerald');
    const presenter = escapeCsvCell(item.presenter);
    const dur = escapeCsvCell(formatTime(item.durationSec));
    const notes = escapeCsvCell(item.notes);
    const audio = escapeCsvCell(item.audioNotes || '');
    const status = escapeCsvCell(item.status);
    rows.push([seg, title, category, colorStripe, presenter, dur, notes, audio, status].join(','));
  }

  return rows.join('\r\n');
}

/**
 * Standard CSV Template with Category and Color Stripe for quick reference & download
 */
export const SAMPLE_CSV_TEMPLATE = `Segment #,Title,Category,Color Stripe,Presenter,Duration,Notes,Audio Note,Status
01,Pre-Show Countdown & Cold Open,Intro / Opener,cyan,Control Room,03:00,Roll title graphics & promo,Background theme music,pending
02,Top Stories & Headlines,Live Content,emerald,Alex Rivera,05:00,Camera 1 close-up,Host mic live,pending
03,Headline Graphic Breakdown,Graphics Item,fuchsia,Graphics Op,01:00,Full-screen chart overlay,Host voiceover only,pending
04,Live Field Interview,Interview / Guest,purple,Dr. Elena Vance,08:00,Split-screen remote video feed,Guest remote audio + host mic,pending
05,Video Package / VT Roll,Video / VT Roll,blue,Control Room,04:00,Roll 4K VT documentary b-roll,Video track audio,pending
06,Mid-Roll Commercial Break,Commercial / Break,amber,Ad Reel,02:00,Automated 60s sponsor spots,Ad reel audio only,pending
07,Featured Sponsor Spotlight,Sponsor / Promo,orange,Alex Rivera,01:30,Showcase sponsor banner on screen,Host mic + soft bed,pending
08,Live Music Performance,Music / SFX,indigo,Guest Musician,04:30,Warm spotlight; center stage,Guitar & vocal mic live,pending
09,Sign-off Tease & Credits,Outro / Wrap-Up,rose,Alex Rivera,02:00,Roll credits scroll,Outro music fade out,pending`;

function escapeCsvCell(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Preset rundown templates with basic Audio Note, Category, and Color Stripe
 */
export const RUNDOWN_TEMPLATES = [
  {
    name: 'Live Studio Broadcast',
    description: 'Standard 45-minute multi-block television / streaming rundown with colored segments',
    items: [
      { id: '1', segmentNumber: '01', title: 'Cold Open & Theme VT', presenter: 'Control Room', durationSec: 90, notes: 'Roll animated theme, Cam 1 ready', audioNotes: 'Theme music track', status: 'pending', color: 'cyan' },
      { id: '2', segmentNumber: '02', title: 'Top Stories & Headline Rundown', presenter: 'Anchor A', durationSec: 300, notes: 'Lower-third strap graphics', audioNotes: 'Anchor A mic live', status: 'pending', color: 'emerald' },
      { id: '3', segmentNumber: '03', title: 'Full-Screen Stats & Charts Graphic', presenter: 'Graphics Op', durationSec: 90, notes: 'Display full-screen broadcast graphic card', audioNotes: 'Anchor voiceover', status: 'pending', color: 'fuchsia' },
      { id: '4', segmentNumber: '04', title: 'Live Field Report: Remote Feed', presenter: 'Reporter (Live Remote)', durationSec: 240, notes: 'Split screen 2-box view', audioNotes: 'Remote reporter mic', status: 'pending', color: 'blue' },
      { id: '5', segmentNumber: '05', title: 'Commercial Break 1', presenter: 'Ad VT', durationSec: 120, notes: 'Automated ad reel, talent check', audioNotes: 'Ad video audio only', status: 'pending', color: 'amber' },
      { id: '6', segmentNumber: '06', title: 'Feature Interview & Deep Dive', presenter: 'Anchor & Guest', durationSec: 480, notes: 'Wide 3-camera shot, b-roll at 02:00', audioNotes: 'Host & guest mics', status: 'pending', color: 'purple' },
      { id: '7', segmentNumber: '07', title: 'Sign-off, Tease & Credits', presenter: 'Anchors A & B', durationSec: 90, notes: 'Roll credits, fade black', audioNotes: 'Outro theme music', status: 'pending', color: 'rose' }
    ] as RundownItem[]
  },
  {
    name: 'Tech Conference & Keynote',
    description: 'Executive presentation with speaker timing, product reveals, and graphics slides',
    items: [
      { id: '1', segmentNumber: '01', title: 'Walk-in Music & Welcome Slides', presenter: 'AV Tech', durationSec: 600, notes: 'House lights 50%, ambient loop', audioNotes: 'Walk-in playlist', status: 'pending', color: 'indigo' },
      { id: '2', segmentNumber: '02', title: 'Opening Remarks & Host Kickoff', presenter: 'Emcee', durationSec: 180, notes: 'Spotlight stage center', audioNotes: 'Emcee handheld mic', status: 'pending', color: 'cyan' },
      { id: '3', segmentNumber: '03', title: 'Keynote Address: Future of AI', presenter: 'CEO', durationSec: 1200, notes: 'Confidence monitor clicker sync', audioNotes: 'CEO headset mic', status: 'pending', color: 'emerald' },
      { id: '4', segmentNumber: '04', title: 'Product Roadmap & Pricing Graphic', presenter: 'Graphics Op', durationSec: 180, notes: 'Full LED wall spec comparison graphic', audioNotes: 'Speaker mic only', status: 'pending', color: 'fuchsia' },
      { id: '5', segmentNumber: '05', title: 'Live Product Reveal & Stage Demo', presenter: 'VP Product & Lead Eng', durationSec: 900, notes: 'Switch main screen to 4K HDMI feed', audioNotes: 'Demo laptop audio + mics', status: 'pending', color: 'blue' },
      { id: '6', segmentNumber: '06', title: 'Wrap-up & Call to Action', presenter: 'Emcee', durationSec: 240, notes: 'Direct attendees to break-out sessions', audioNotes: 'Emcee mic + outro music', status: 'pending', color: 'rose' }
    ] as RundownItem[]
  },
  {
    name: 'Podcast / Talk Show',
    description: 'Episodic timing with ad breaks, sponsor reads, graphics overlays, and topic transitions',
    items: [
      { id: '1', segmentNumber: '01', title: 'Intro Banter & Icebreaker', presenter: 'Hosts', durationSec: 300, notes: 'Casual warm-up, mention episode sponsor', audioNotes: 'Host mics + intro stinger', status: 'pending', color: 'cyan' },
      { id: '2', segmentNumber: '02', title: 'Topic 1: Tech Industry Trends', presenter: 'Hosts', durationSec: 720, notes: 'Show visual chart on display monitor', audioNotes: 'Both host mics live', status: 'pending', color: 'emerald' },
      { id: '3', segmentNumber: '03', title: 'Chart & Poll Results Overlay', presenter: 'Producer', durationSec: 120, notes: 'Show audience poll graphic overlay', audioNotes: 'Host commentary', status: 'pending', color: 'fuchsia' },
      { id: '4', segmentNumber: '04', title: 'Mid-Roll Sponsor Ad Read', presenter: 'Host A', durationSec: 90, notes: 'Read mandatory promo copy verbatim', audioNotes: 'Host A mic + soft music bed', status: 'pending', color: 'orange' },
      { id: '5', segmentNumber: '05', title: 'Listener Voicemails / Q&A', presenter: 'Host B', durationSec: 420, notes: 'Play audio voicemails from soundboard', audioNotes: 'Voicemail playback + mics', status: 'pending', color: 'purple' },
      { id: '6', segmentNumber: '06', title: 'Outro, Social Plugs & Teaser', presenter: 'Hosts', durationSec: 180, notes: 'Remind listeners to subscribe and review', audioNotes: 'Outro theme music', status: 'pending', color: 'rose' }
    ] as RundownItem[]
  },
  {
    name: 'Live Stage & Event Production',
    description: 'Concert & live stage rundown with band tracks, speaker segments, and stage visuals',
    items: [
      { id: '1', segmentNumber: '01', title: 'House Pre-Show Atmosphere', presenter: 'FOH Audio', durationSec: 900, notes: 'Stage wash lighting, roll sponsor slides', audioNotes: 'House playlist', status: 'pending', color: 'indigo' },
      { id: '2', segmentNumber: '02', title: 'Band Walk-on & Intro Track', presenter: 'Full Band', durationSec: 120, notes: 'Spotlights on drummer & guitarist', audioNotes: 'Intro backing track + band live', status: 'pending', color: 'cyan' },
      { id: '3', segmentNumber: '03', title: 'Stage Sponsor & Lyrics Graphic', presenter: 'Visual Tech', durationSec: 120, notes: 'LED backdrop motion graphics loop', audioNotes: 'Ambient pad', status: 'pending', color: 'fuchsia' },
      { id: '4', segmentNumber: '04', title: 'Opening Song (High Energy)', presenter: 'Lead Singer & Band', durationSec: 270, notes: 'Front stage strobes on chorus', audioNotes: 'Lead vocal & full band', status: 'pending', color: 'indigo' },
      { id: '5', segmentNumber: '05', title: 'Lead Singer Welcome & MC', presenter: 'Lead Singer', durationSec: 90, notes: 'Band sustains acoustic pad', audioNotes: 'Vocal mic + light pad', status: 'pending', color: 'emerald' },
      { id: '6', segmentNumber: '06', title: 'Closing Anthem & Encore', presenter: 'Full Ensemble', durationSec: 360, notes: 'All stage fixtures full', audioNotes: 'Full ensemble live', status: 'pending', color: 'indigo' },
      { id: '7', segmentNumber: '07', title: 'Walk-out Music & Stage Power Down', presenter: 'Stage Mgr', durationSec: 300, notes: 'Work lights on, guide audience to exits', audioNotes: 'Walk-out music playlist', status: 'pending', color: 'rose' }
    ] as RundownItem[]
  }
];

