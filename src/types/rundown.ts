export interface RundownItem {
  id: string;
  segmentNumber: string;
  title: string;
  presenter: string;
  durationSec: number;
  plannedStartTime?: string;
  notes: string; // General / Video / Tech notes
  audioNotes: string; // Basic audio note
  status: 'pending' | 'cue' | 'live' | 'done' | 'skipped';
  color?: string; // Visual category color (e.g. 'amber' for Commercial, 'cyan' for Intro, 'emerald' for Live Content, 'fuchsia' for Graphics Item, etc.)
}

export interface TimerState {
  activeItemIndex: number;
  isRunning: boolean;
  timeRemaining: number;
  duration: number;
  isOvertime: boolean;
  startedAt: number | null;
  pausedAt: number | null;
  elapsedInSegment: number;
  showStartTime: number | null;
  autoAdvance: boolean;
  flashAlert: boolean;
}

export interface SessionState {
  id: string;
  title: string;
  plannedStartTime: string; // e.g. "19:00:00"
  googleSheetUrl: string;
  autoSyncSheet: boolean;
  syncIntervalSec: number;
  lastSyncedAt?: number;
  items: RundownItem[];
  timer: TimerState;
  updatedAt: number;
}

export type ViewTab = 'split' | 'rundown' | 'timer' | 'stage';

export type FoldSplitOrientation = 'vertical' | 'horizontal'; // 'vertical' = Top/Bottom halves, 'horizontal' = Left/Right halves

export interface FoldableConfig {
  isFoldableMode: boolean;
  orientation: FoldSplitOrientation;
  swapHalves: boolean;
  hingeGapPx: number; // padding across the crease
  autoDetected: boolean;
  devicePreset?: 'galaxy-fold' | 'pixel-fold' | 'custom';
  viewMode?: 'split' | 'stage' | 'rundown';
}

