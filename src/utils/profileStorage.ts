import { RundownItem } from '../types/rundown';
import { resolveColorFromCategory } from './csvParser';

export type ProfileCategory = 'broadcast' | 'conference' | 'church' | 'podcast' | 'sports' | 'custom';

export interface RundownProfile {
  id: string;
  name: string;
  description: string;
  category: ProfileCategory;
  plannedStartTime: string; // e.g. "19:00:00"
  items: RundownItem[];
  googleSheetUrl?: string;
  autoSyncSheet?: boolean;
  syncIntervalSec?: number;
  lastSyncedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export const CATEGORY_LABELS: Record<ProfileCategory, { label: string; color: string; bg: string; border: string }> = {
  broadcast: { label: 'TV / Live Show', color: 'text-emerald-400', bg: 'bg-emerald-950/70', border: 'border-emerald-500/30' },
  church: { label: 'Worship / Church', color: 'text-amber-400', bg: 'bg-amber-950/70', border: 'border-amber-500/30' },
  conference: { label: 'Conference / Talk', color: 'text-cyan-400', bg: 'bg-cyan-950/70', border: 'border-cyan-500/30' },
  podcast: { label: 'Live Podcast', color: 'text-purple-400', bg: 'bg-purple-950/70', border: 'border-purple-500/30' },
  sports: { label: 'Sports / Gaming', color: 'text-rose-400', bg: 'bg-rose-950/70', border: 'border-rose-500/30' },
  custom: { label: 'Custom Event', color: 'text-blue-400', bg: 'bg-blue-950/70', border: 'border-blue-500/30' }
};

export const DEFAULT_PROFILES: RundownProfile[] = [
  {
    id: 'profile-broadcast-main',
    name: "Cyril Walucho's Prime Time Live",
    description: "Multi-segment live broadcast show with VT rolls, live demos, sponsor spots, and audience Q&A.",
    category: 'broadcast',
    plannedStartTime: '19:00:00',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000,
    items: [
      {
        id: 'seg-1',
        segmentNumber: '01',
        title: 'Pre-Show & Countdown VT',
        presenter: 'Control Room',
        durationSec: 180,
        notes: 'Roll promo reel, check video wall',
        audioNotes: 'Background theme music',
        status: 'pending',
        color: 'cyan'
      },
      {
        id: 'seg-2',
        segmentNumber: '02',
        title: 'Show Intro & Cold Open',
        presenter: 'Main Host',
        durationSec: 120,
        notes: 'Camera 1 direct to lens',
        audioNotes: 'Host mic live',
        status: 'pending',
        color: 'cyan'
      },
      {
        id: 'seg-3',
        segmentNumber: '03',
        title: 'Show Graphics & Agenda Slide',
        presenter: 'Graphics Op',
        durationSec: 60,
        notes: 'Full-screen agenda graphic card',
        audioNotes: 'Host voiceover',
        status: 'pending',
        color: 'fuchsia'
      },
      {
        id: 'seg-4',
        segmentNumber: '04',
        title: 'Opening Remarks & Rundown Overview',
        presenter: 'Host & Co-Host',
        durationSec: 240,
        notes: 'Introduce live stream guests, poll audience in chat',
        audioNotes: 'Host & co-host mics open',
        status: 'pending',
        color: 'emerald'
      },
      {
        id: 'seg-5',
        segmentNumber: '05',
        title: 'Keynote Feature: Live Demo',
        presenter: 'Product Lead (Marcus)',
        durationSec: 600,
        notes: 'Switch to Screen Share feed',
        audioNotes: 'Laptop audio + Marcus headset',
        status: 'pending',
        color: 'blue'
      },
      {
        id: 'seg-6',
        segmentNumber: '06',
        title: 'Sponsor Message & Commercial VT',
        presenter: 'VT Roll',
        durationSec: 60,
        notes: 'Play pre-recorded sponsor spot 1080p',
        audioNotes: 'Commercial video audio',
        status: 'pending',
        color: 'amber'
      },
      {
        id: 'seg-7',
        segmentNumber: '07',
        title: 'Audience Q&A & Community Spotlight',
        presenter: 'Panel',
        durationSec: 420,
        notes: 'Display top 3 questions on floor teleprompter',
        audioNotes: 'Panel & audience mics',
        status: 'pending',
        color: 'purple'
      },
      {
        id: 'seg-8',
        segmentNumber: '08',
        title: 'Closing Announcements & Credits',
        presenter: 'Main Host',
        durationSec: 180,
        notes: 'Plug next week episode, roll credits, fade to black',
        audioNotes: 'Host mic + outro music',
        status: 'pending',
        color: 'rose'
      }
    ]
  },
  {
    id: 'profile-worship-service',
    name: "Sunday Live Worship Service",
    description: "Full church production rundown with prelude, worship music set, announcements, sermon, and benediction.",
    category: 'church',
    plannedStartTime: '10:00:00',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 7200000,
    items: [
      {
        id: 'ws-1',
        segmentNumber: '01',
        title: 'Pre-Service Countdown & Slides',
        presenter: 'AV Tech',
        durationSec: 300,
        notes: 'Display welcome slides, livestream countdown on main display',
        audioNotes: 'Atmospheric pad / ambient playlist at -18dB',
        status: 'pending',
        color: 'cyan'
      },
      {
        id: 'ws-2',
        segmentNumber: '02',
        title: 'Call to Worship & Opening Song',
        presenter: 'Worship Leader & Band',
        durationSec: 360,
        notes: 'House lights 70%, stage lights warm amber',
        audioNotes: 'Full band mix open, worship leader vocal on ch 1',
        status: 'pending',
        color: 'indigo'
      },
      {
        id: 'ws-3',
        segmentNumber: '03',
        title: 'Praise & Worship Set (3 Songs)',
        presenter: 'Worship Team',
        durationSec: 900,
        notes: 'Project lyrics on screen, fade stage backlights dynamically',
        audioNotes: 'Drums, Bass, Keys, Acoustic, Vocals 1-4 active',
        status: 'pending',
        color: 'indigo'
      },
      {
        id: 'ws-4',
        segmentNumber: '04',
        title: 'Community Announcements & Giving',
        presenter: 'Associate Pastor',
        durationSec: 240,
        notes: 'Show QR code for online giving on stage screens',
        audioNotes: 'Podium mic live, soft acoustic guitar underscore',
        status: 'pending',
        color: 'orange'
      },
      {
        id: 'ws-5',
        segmentNumber: '05',
        title: 'Scripture Reading & Message / Sermon',
        presenter: 'Senior Pastor',
        durationSec: 2100,
        notes: 'Camera 1 locked on pulpit, Scripture verses on screen',
        audioNotes: 'Pastor head-worn wireless mic, mute band channels',
        status: 'pending',
        color: 'emerald'
      },
      {
        id: 'ws-6',
        segmentNumber: '06',
        title: 'Closing Response & Benediction',
        presenter: 'Pastor & Worship Team',
        durationSec: 360,
        notes: 'House lights up to 100%, benediction slide',
        audioNotes: 'Keyboard pad swell, Pastor blessing, final song chorus',
        status: 'pending',
        color: 'purple'
      },
      {
        id: 'ws-7',
        segmentNumber: '07',
        title: 'Postlude & Fellowship Music',
        presenter: 'AV Booth',
        durationSec: 600,
        notes: 'Foyer screens active with event notices',
        audioNotes: 'Upbeat post-service playlist through sanctuary & lobby',
        status: 'pending',
        color: 'rose'
      }
    ]
  },
  {
    id: 'profile-tech-keynote',
    name: "Global Tech Summit Keynote",
    description: "High-stakes corporate conference keynote with CEO address, hardware reveals, and live software demo.",
    category: 'conference',
    plannedStartTime: '14:00:00',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 1800000,
    items: [
      {
        id: 'tk-1',
        segmentNumber: '01',
        title: 'Walk-In Music & Staging Graphic',
        presenter: 'Stage Manager',
        durationSec: 600,
        notes: 'Keynote banner on 4K LED backdrop, audience seated',
        audioNotes: 'Sleek electronic upbeat pre-roll music',
        status: 'pending',
        color: 'indigo'
      },
      {
        id: 'tk-2',
        segmentNumber: '02',
        title: 'Opening Teaser VT & Lights Show',
        presenter: 'Production Ops',
        durationSec: 90,
        notes: 'Blackout house, laser cue 01, video sync roll',
        audioNotes: 'Surround 5.1 trailer audio, master punch LUFS -12',
        status: 'pending',
        color: 'cyan'
      },
      {
        id: 'tk-3',
        segmentNumber: '03',
        title: 'Vision 2026: Executive Address',
        presenter: 'CEO',
        durationSec: 900,
        notes: 'Downstage center spotlight, teleprompter feed active',
        audioNotes: 'CEO DPA headset live, noise cancellation gate on',
        status: 'pending',
        color: 'emerald'
      },
      {
        id: 'tk-4',
        segmentNumber: '04',
        title: 'Product Reveal: Hardware & Cloud',
        presenter: 'VP of Engineering',
        durationSec: 720,
        notes: 'Cue product pedestal rise from center stage',
        audioNotes: 'Presentation slides clicker audio, VP headset',
        status: 'pending',
        color: 'blue'
      },
      {
        id: 'tk-5',
        segmentNumber: '05',
        title: 'Interactive Live Demo with Audience',
        presenter: 'Lead Architect',
        durationSec: 480,
        notes: 'Screen switch to iPad feed, stage monitors mirroring',
        audioNotes: 'Architect mic + demo audio',
        status: 'pending',
        color: 'emerald'
      },
      {
        id: 'tk-6',
        segmentNumber: '06',
        title: 'Pricing, Availability & Press Q&A',
        presenter: 'Executive Team',
        durationSec: 600,
        notes: 'Staging 3 armchairs for executive panel, floor mics armed',
        audioNotes: 'Panel mics 1, 2, 3 and press wireless handhelds active',
        status: 'pending',
        color: 'purple'
      }
    ]
  },
  {
    id: 'profile-podcast-live',
    name: "Live Studio Video Podcast",
    description: "Episodic multi-camera video podcast recording with co-hosts, sponsor read, and guest call-in.",
    category: 'podcast',
    plannedStartTime: '18:30:00',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 14400000,
    items: [
      {
        id: 'pod-1',
        segmentNumber: '01',
        title: 'Audio Check & Stream Pre-Roll',
        presenter: 'Producer',
        durationSec: 180,
        notes: 'Test OBS ISO recording for Cam 1, 2, 3',
        audioNotes: 'Check gain levels on SM7B mics for Host & Guest',
        status: 'pending',
        color: 'indigo'
      },
      {
        id: 'pod-2',
        segmentNumber: '02',
        title: 'Podcast Intro & Episode Hook',
        presenter: 'Lead Host',
        durationSec: 120,
        notes: 'Camera 1 close-up, show lower third with episode title',
        audioNotes: 'Podcast intro stinger jingle, duck under host voice',
        status: 'pending',
        color: 'cyan'
      },
      {
        id: 'pod-3',
        segmentNumber: '03',
        title: 'Trending Headlines & Banter',
        presenter: 'Host & Co-Host',
        durationSec: 900,
        notes: 'Split screen 2-shot, overlay reference tweets on screen',
        audioNotes: 'Keep compressor/limiter tight to avoid clipping',
        status: 'pending',
        color: 'emerald'
      },
      {
        id: 'pod-4',
        segmentNumber: '04',
        title: 'Primary Sponsor Segment',
        presenter: 'Lead Host',
        durationSec: 90,
        notes: 'Full frame host holding sponsor product, overlay promo code',
        audioNotes: 'Subtle acoustic background bed',
        status: 'pending',
        color: 'orange'
      },
      {
        id: 'pod-5',
        segmentNumber: '05',
        title: 'Special Guest Deep-Dive Interview',
        presenter: 'Host & Special Guest',
        durationSec: 1800,
        notes: 'Dynamic camera switcher (auto-follow speaker or manual)',
        audioNotes: 'Guest remote audio feed mix-minus setup',
        status: 'pending',
        color: 'purple'
      },
      {
        id: 'pod-6',
        segmentNumber: '06',
        title: 'Listener Questions & Episode Outro',
        presenter: 'Hosts',
        durationSec: 300,
        notes: 'Show social handles and YouTube subscribe animation',
        audioNotes: 'Outro theme music swell, wrap mics, fade out',
        status: 'pending',
        color: 'rose'
      }
    ]
  },
  {
    id: 'profile-esports-final',
    name: "Esports Championship Grand Final",
    description: "Fast-paced competitive gaming broadcast with caster desk, hype package, maps, and trophy presentation.",
    category: 'sports',
    plannedStartTime: '15:00:00',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 21600000,
    items: [
      {
        id: 'esp-1',
        segmentNumber: '01',
        title: 'Tournament Hype Teaser & DJ Set',
        presenter: 'Broadcast Director',
        durationSec: 300,
        notes: 'Arena strobe effects, team highlight reel on stadium screen',
        audioNotes: 'High-energy electronic track, master limiter at 0dB peak',
        status: 'pending',
        color: 'indigo'
      },
      {
        id: 'esp-2',
        segmentNumber: '02',
        title: 'Analyst Desk Matchup Preview',
        presenter: 'Desk Host & Analysts',
        durationSec: 420,
        notes: 'Wide arena shot to 3-analyst desk, stat overlays',
        audioNotes: 'Desk headset mics live, isolate crowd noise',
        status: 'pending',
        color: 'cyan'
      },
      {
        id: 'esp-3',
        segmentNumber: '03',
        title: 'Team Walk-Ins & Player Intros',
        presenter: 'Stage Emcee',
        durationSec: 240,
        notes: 'Player tunnel smoke and individual spotlight walks',
        audioNotes: 'Walk-out anthems, Emcee handheld mic live',
        status: 'pending',
        color: 'blue'
      },
      {
        id: 'esp-4',
        segmentNumber: '04',
        title: 'Grand Final: Game 1 (Live Match)',
        presenter: 'Play-by-Play & Color Caster',
        durationSec: 1800,
        notes: 'Switch to Spectator feed, PiP player facecams',
        audioNotes: 'Game sound 60%, Casters 100%, crowd mics 20%',
        status: 'pending',
        color: 'emerald'
      },
      {
        id: 'esp-5',
        segmentNumber: '05',
        title: 'Halftime Replay Breakdown & Ad Roll',
        presenter: 'Analyst Desk',
        durationSec: 360,
        notes: 'Slow-motion replay clips with telestrator analysis',
        audioNotes: 'Roll sponsor ad audio then back to desk',
        status: 'pending',
        color: 'amber'
      },
      {
        id: 'esp-6',
        segmentNumber: '06',
        title: 'Grand Final: Game 2 & Decider',
        presenter: 'Casters',
        durationSec: 2100,
        notes: 'Live match feed, alert confetti cannons on match point',
        audioNotes: 'Caster hype levels peaked, game SFX active',
        status: 'pending',
        color: 'emerald'
      },
      {
        id: 'esp-7',
        segmentNumber: '07',
        title: 'Trophy Presentation & MVP Interview',
        presenter: 'Emcee & Winning Team',
        durationSec: 420,
        notes: 'Confetti drop, champion team lifting trophy center stage',
        audioNotes: 'Victory theme, stadium crowd mic open, Emcee mic',
        status: 'pending',
        color: 'rose'
      }
    ]
  }
];

const LOCAL_STORAGE_PROFILES_KEY = 'cyril_ro_profiles_v2';
const LOCAL_STORAGE_ACTIVE_PROFILE_KEY = 'cyril_ro_active_profile_id_v2';
const LOCAL_STORAGE_LAST_EVENTS_KEY = 'cyril_ro_last_active_events_v3';

export interface LastActiveState {
  sessionId?: string;
  title: string;
  plannedStartTime: string;
  googleSheetUrl: string;
  autoSyncSheet: boolean;
  syncIntervalSec: number;
  lastSyncedAt?: number;
  items: RundownItem[];
  activeProfileId?: string;
  updatedAt: number;
  isCustomized: boolean;
}

export class ProfileStorage {
  /**
   * Load all profiles from localStorage, with fallback to default profiles.
   * Completely safe in offline environments (like APK / airplane mode).
   */
  static getProfiles(): RundownProfile[] {
    if (typeof window === 'undefined') return DEFAULT_PROFILES;
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: RundownProfile) => ({
            ...p,
            items: (p.items || []).map((it: RundownItem) => ({
              ...it,
              color: it.color || resolveColorFromCategory(undefined, it.title)
            }))
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse profiles from localStorage, falling back to defaults:', e);
    }
    // First time init: save defaults to localStorage
    ProfileStorage.saveProfiles(DEFAULT_PROFILES);
    return DEFAULT_PROFILES;
  }

  /**
   * Save full profiles array to localStorage.
   */
  static saveProfiles(profiles: RundownProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles to localStorage:', e);
    }
  }

  /**
   * Get active profile ID.
   */
  static getActiveProfileId(): string {
    if (typeof window === 'undefined') return DEFAULT_PROFILES[0].id;
    try {
      const id = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROFILE_KEY);
      if (id) return id;
    } catch (e) {
      console.warn('Error reading active profile ID:', e);
    }
    const defaultId = DEFAULT_PROFILES[0].id;
    ProfileStorage.setActiveProfileId(defaultId);
    return defaultId;
  }

  /**
   * Set active profile ID in localStorage.
   */
  static setActiveProfileId(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE_KEY, id);
    } catch (e) {
      console.warn('Error setting active profile ID:', e);
    }
  }

  /**
   * Get the active profile object.
   */
  static getActiveProfile(): RundownProfile {
    const profiles = ProfileStorage.getProfiles();
    const activeId = ProfileStorage.getActiveProfileId();
    const found = profiles.find(p => p.id === activeId);
    if (found) return found;
    return profiles[0] || DEFAULT_PROFILES[0];
  }

  /**
   * Update or insert a single profile.
   */
  static upsertProfile(profile: RundownProfile): RundownProfile[] {
    const profiles = ProfileStorage.getProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id);
    const updated = {
      ...profile,
      updatedAt: Date.now()
    };

    let nextList: RundownProfile[];
    if (idx >= 0) {
      nextList = [...profiles];
      nextList[idx] = updated;
    } else {
      nextList = [updated, ...profiles];
    }

    ProfileStorage.saveProfiles(nextList);
    return nextList;
  }

  /**
   * Create a new profile with given parameters.
   */
  static createProfile(params: {
    name: string;
    description?: string;
    category?: ProfileCategory;
    plannedStartTime?: string;
    items?: RundownItem[];
    googleSheetUrl?: string;
  }): RundownProfile {
    const now = Date.now();
    const id = `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newProfile: RundownProfile = {
      id,
      name: params.name || 'Untitled Show',
      description: params.description || '',
      category: params.category || 'custom',
      plannedStartTime: params.plannedStartTime || '19:00:00',
      items: params.items && params.items.length > 0 ? params.items : [
        {
          id: `item-${Date.now()}-1`,
          segmentNumber: '01',
          title: 'Opening Item',
          presenter: 'Host',
          durationSec: 180,
          notes: 'Opening remarks and schedule',
          audioNotes: 'Host mic live',
          status: 'pending'
        }
      ],
      googleSheetUrl: params.googleSheetUrl || '',
      autoSyncSheet: false,
      syncIntervalSec: 15,
      createdAt: now,
      updatedAt: now
    };

    ProfileStorage.upsertProfile(newProfile);
    return newProfile;
  }

  /**
   * Duplicate an existing profile.
   */
  static duplicateProfile(sourceId: string): RundownProfile | null {
    const profiles = ProfileStorage.getProfiles();
    const source = profiles.find(p => p.id === sourceId);
    if (!source) return null;

    const now = Date.now();
    const clonedItems: RundownItem[] = source.items.map((it, idx) => ({
      ...it,
      id: `item-${now}-${idx}`,
      status: 'pending' // reset to pending for fresh show run
    }));

    const newProfile: RundownProfile = {
      ...source,
      id: `profile-${now}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${source.name} (Copy)`,
      items: clonedItems,
      createdAt: now,
      updatedAt: now
    };

    ProfileStorage.upsertProfile(newProfile);
    return newProfile;
  }

  /**
   * Delete a profile (prevents deleting last profile).
   */
  static deleteProfile(profileId: string): { success: boolean; nextActiveId?: string } {
    const profiles = ProfileStorage.getProfiles();
    if (profiles.length <= 1) {
      return { success: false };
    }

    const nextList = profiles.filter(p => p.id !== profileId);
    ProfileStorage.saveProfiles(nextList);

    let nextActiveId = ProfileStorage.getActiveProfileId();
    if (nextActiveId === profileId) {
      nextActiveId = nextList[0].id;
      ProfileStorage.setActiveProfileId(nextActiveId);
    }

    return { success: true, nextActiveId };
  }

  /**
   * Export all profiles to JSON string for backup/sharing.
   */
  static exportProfilesAsJson(): string {
    const profiles = ProfileStorage.getProfiles();
    return JSON.stringify({
      app: "Cyril Walucho's Rundown Live Free",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      profiles
    }, null, 2);
  }

  /**
   * Import profiles from JSON string.
   */
  static importProfilesFromJson(jsonStr: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      let incomingProfiles: RundownProfile[] = [];

      if (Array.isArray(parsed)) {
        incomingProfiles = parsed;
      } else if (parsed && Array.isArray(parsed.profiles)) {
        incomingProfiles = parsed.profiles;
      } else if (parsed && parsed.id && parsed.name && Array.isArray(parsed.items)) {
        // Single profile imported
        incomingProfiles = [parsed];
      }

      if (incomingProfiles.length === 0) {
        return { success: false, count: 0, error: 'No saved shows found in file' };
      }

      const currentProfiles = ProfileStorage.getProfiles();
      const existingIds = new Set(currentProfiles.map(p => p.id));
      const merged = [...currentProfiles];

      let addedCount = 0;
      for (const item of incomingProfiles) {
        if (!item.name || !Array.isArray(item.items)) continue;
        const safeItem: RundownProfile = {
          id: existingIds.has(item.id) ? `profile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : item.id,
          name: item.name,
          description: item.description || '',
          category: item.category || 'custom',
          plannedStartTime: item.plannedStartTime || '19:00:00',
          items: item.items.map(it => ({
            ...it,
            status: 'pending'
          })),
          googleSheetUrl: item.googleSheetUrl || '',
          autoSyncSheet: !!item.autoSyncSheet,
          syncIntervalSec: item.syncIntervalSec || 15,
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        merged.unshift(safeItem);
        addedCount++;
      }

      ProfileStorage.saveProfiles(merged);
      return { success: true, count: addedCount };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Invalid JSON format' };
    }
  }

  /**
   * Retrieve the last active events set and rundown configuration.
   * This guarantees that when the app is refreshed, it defaults to the last events set,
   * preserving imported Google Sheets, Excel spreadsheets, custom rows, and sync settings.
   */
  static getLastActiveState(sessionId?: string): LastActiveState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_LAST_EVENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          // If a specific session ID is requested, verify or accept if valid
          if (!sessionId || !parsed.sessionId || parsed.sessionId === sessionId) {
            return {
              ...parsed,
              items: parsed.items.map((it: RundownItem) => ({
                ...it,
                color: it.color || resolveColorFromCategory(undefined, it.title)
              }))
            } as LastActiveState;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading last active rundown state:', e);
    }
    return null;
  }

  /**
   * Save the current active rundown events set, Google Sheet config, and metadata.
   * Also ensures the active profile is kept in sync.
   */
  static saveLastActiveState(state: Partial<LastActiveState> & { items: RundownItem[] }): LastActiveState {
    const existing = typeof window !== 'undefined' ? ProfileStorage.getLastActiveState(state.sessionId) : null;
    const now = Date.now();

    const fullState: LastActiveState = {
      sessionId: state.sessionId || existing?.sessionId || 'main',
      title: state.title ?? existing?.title ?? "Cyril Walucho's Rundown Live Free",
      plannedStartTime: state.plannedStartTime ?? existing?.plannedStartTime ?? '19:00:00',
      googleSheetUrl: state.googleSheetUrl !== undefined ? state.googleSheetUrl : (existing?.googleSheetUrl || ''),
      autoSyncSheet: state.autoSyncSheet !== undefined ? state.autoSyncSheet : (existing?.autoSyncSheet || false),
      syncIntervalSec: state.syncIntervalSec ?? existing?.syncIntervalSec ?? 15,
      lastSyncedAt: state.lastSyncedAt ?? existing?.lastSyncedAt,
      items: state.items,
      activeProfileId: state.activeProfileId || existing?.activeProfileId || ProfileStorage.getActiveProfileId(),
      updatedAt: now,
      isCustomized: state.isCustomized ?? true
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_LAST_EVENTS_KEY, JSON.stringify(fullState));
      } catch (e) {
        console.error('Error saving last active rundown state:', e);
      }
    }

    // Keep active profile in sync
    const activeProf = ProfileStorage.getActiveProfile();
    if (activeProf) {
      ProfileStorage.upsertProfile({
        ...activeProf,
        name: fullState.title || activeProf.name,
        plannedStartTime: fullState.plannedStartTime,
        googleSheetUrl: fullState.googleSheetUrl,
        autoSyncSheet: fullState.autoSyncSheet,
        syncIntervalSec: fullState.syncIntervalSec,
        lastSyncedAt: fullState.lastSyncedAt,
        items: fullState.items,
        updatedAt: now
      });
    }

    return fullState;
  }

  /**
   * Clear saved last active state (e.g. for complete fresh reset).
   */
  static clearLastActiveState(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOCAL_STORAGE_LAST_EVENTS_KEY);
    } catch (e) {
      console.warn('Error clearing last active rundown state:', e);
    }
  }
}

