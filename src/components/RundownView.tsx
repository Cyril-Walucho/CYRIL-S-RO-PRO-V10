import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { RundownItem } from '../types/rundown';
import { formatTime, parseTimeToSeconds, addSecondsToClockTime, getCurrentTimeOfDay } from '../utils/timeFormat';
import { 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Trash2, 
  Copy, 
  Search, 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  Sparkles,
  RefreshCw,
  Edit2,
  X,
  Check,
  FolderKanban,
  Tv,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronRight,
  Palette,
  GripVertical
} from 'lucide-react';

import * as XLSX from 'xlsx';
import { csvToRundownItems, sheetTo2DStringArray } from '../utils/csvParser';

export const SEGMENT_COLOR_PALETTES: Record<
  string,
  {
    name: string;
    stripeColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    progressFill: string;
    dotColor: string;
  }
> = {
  cyan: {
    name: 'Opening / Intro',
    stripeColor: 'bg-cyan-500',
    badgeBg: 'bg-cyan-950/60',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-700/50',
    progressFill: 'bg-cyan-500',
    dotColor: 'bg-cyan-400'
  },
  emerald: {
    name: 'Main Content / Live',
    stripeColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-950/60',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700/50',
    progressFill: 'bg-emerald-500',
    dotColor: 'bg-emerald-400'
  },
  amber: {
    name: 'Break / Ad',
    stripeColor: 'bg-amber-500',
    badgeBg: 'bg-amber-950/60',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-700/50',
    progressFill: 'bg-amber-500',
    dotColor: 'bg-amber-400'
  },
  purple: {
    name: 'Interview / Guest',
    stripeColor: 'bg-purple-500',
    badgeBg: 'bg-purple-950/60',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-700/50',
    progressFill: 'bg-purple-500',
    dotColor: 'bg-purple-400'
  },
  blue: {
    name: 'Video Clip',
    stripeColor: 'bg-blue-500',
    badgeBg: 'bg-blue-950/60',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-700/50',
    progressFill: 'bg-blue-500',
    dotColor: 'bg-blue-400'
  },
  orange: {
    name: 'Sponsor / Ad Read',
    stripeColor: 'bg-orange-500',
    badgeBg: 'bg-orange-950/60',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-700/50',
    progressFill: 'bg-orange-500',
    dotColor: 'bg-orange-400'
  },
  rose: {
    name: 'Closing / End',
    stripeColor: 'bg-rose-500',
    badgeBg: 'bg-rose-950/60',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-700/50',
    progressFill: 'bg-rose-500',
    dotColor: 'bg-rose-400'
  },
  indigo: {
    name: 'Music / Sound',
    stripeColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-950/60',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-700/50',
    progressFill: 'bg-indigo-500',
    dotColor: 'bg-indigo-400'
  },
  fuchsia: {
    name: 'Graphics Item',
    stripeColor: 'bg-fuchsia-500',
    badgeBg: 'bg-fuchsia-950/60',
    badgeText: 'text-fuchsia-300',
    badgeBorder: 'border-fuchsia-700/50',
    progressFill: 'bg-fuchsia-500',
    dotColor: 'bg-fuchsia-400'
  }
};

export const getSegmentColor = (colorKey?: string) => {
  if (colorKey && SEGMENT_COLOR_PALETTES[colorKey.toLowerCase()]) {
    return SEGMENT_COLOR_PALETTES[colorKey.toLowerCase()];
  }
  return null;
};

const getStatusLabel = (status: RundownItem['status']) => {
  switch (status) {
    case 'pending': return 'WAITING';
    case 'cue': return 'NEXT UP';
    case 'live': return 'LIVE';
    case 'done': return 'DONE';
    case 'skipped': return 'SKIP';
    default: return status;
  }
};

interface RundownViewProps {
  items: RundownItem[];
  activeItemIndex: number;
  plannedStartTime: string;
  isTimerRunning: boolean;
  timeRemaining?: number;
  timerDuration?: number;
  googleSheetUrl: string;
  autoSyncSheet: boolean;
  isSyncingSheet: boolean;
  onUpdateItems: (newItems: RundownItem[]) => void;
  onUpdatePlannedStartTime: (time: string) => void;
  onSelectAndStartItem: (index: number) => void;
  onCueItem: (index: number) => void;
  onOpenSheetModal: () => void;
  onOpenCsvModal: () => void;
  onOpenTemplatesModal: () => void;
  onTriggerSync: () => void;
  activeProfileName?: string;
  onOpenProfilesModal?: () => void;
  onOpenShareDisplayModal?: () => void;
  onOpenBackupModal?: () => void;
  isSplitMode?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RundownView: React.FC<RundownViewProps> = ({
  items,
  activeItemIndex,
  plannedStartTime,
  isTimerRunning,
  timeRemaining,
  timerDuration,
  googleSheetUrl,
  autoSyncSheet,
  isSyncingSheet,
  onUpdateItems,
  onUpdatePlannedStartTime,
  onSelectAndStartItem,
  onCueItem,
  onOpenSheetModal,
  onOpenCsvModal,
  onOpenTemplatesModal,
  onTriggerSync,
  activeProfileName,
  onOpenProfilesModal,
  onOpenShareDisplayModal,
  onOpenBackupModal,
  isSplitMode = false,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isQuickAddMenuOpen, setIsQuickAddMenuOpen] = useState(false);

  // Hidden direct file input for instant 1-tap phone storage import
  const directFileInputRef = useRef<HTMLInputElement | null>(null);

  const processSpreadsheetFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('No worksheets found in this spreadsheet file.');
      }

      let parsedSegments: RundownItem[] = [];
      for (const name of wb.SheetNames) {
        const ws = wb.Sheets[name];
        if (!ws) continue;
        const strRows = sheetTo2DStringArray(ws, XLSX);
        const items = csvToRundownItems(strRows);
        if (items.length > 0) {
          parsedSegments = items;
          break;
        }
      }

      if (parsedSegments.length === 0) {
        throw new Error('Could not find any schedule items in this file. Check that your file has titles and times.');
      }

      onUpdateItems(parsedSegments);
      onShowToast?.(`Loaded ${parsedSegments.length} items from ${file.name}!`, 'success');
    } catch (err: any) {
      onShowToast?.(err.message || 'Could not open this file', 'error');
    }
  };

  const handleTriggerDirectImport = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof (window as any).showOpenFilePicker === 'function') {
      try {
        const handles = await (window as any).showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'Spreadsheet files (.xlsx, .csv, .xls)',
            accept: {
              '*/*': ['.xlsx', '.xls', '.csv', '.tsv', '.ods']
            }
          }]
        });
        if (handles && handles.length > 0) {
          const file = await handles[0].getFile();
          if (file) {
            await processSpreadsheetFile(file);
            return;
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    directFileInputRef.current?.click();
  };

  const handleDirectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processSpreadsheetFile(file);
  };

  // References for auto-scrolling to active segment & touch drag-and-drop reordering
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const rowElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState<{
    itemId: string;
    startIndex: number;
    hoverIndex: number;
    deltaY: number;
    itemHeight: number;
  } | null>(null);

  const dragMetaRef = useRef<{
    itemId: string;
    startIndex: number;
    hoverIndex: number;
    startClientY: number;
    lastClientY: number;
    initialScrollTop: number;
    itemHeight: number;
    midYs: number[];
  } | null>(null);

  const itemsLatestRef = useRef(items);
  itemsLatestRef.current = items;
  const onUpdateItemsRef = useRef(onUpdateItems);
  onUpdateItemsRef.current = onUpdateItems;

  // Auto-scroll container when dragging near top/bottom edge
  useEffect(() => {
    if (!dragState) return;
    let rafId: number;

    const tickAutoScroll = () => {
      const meta = dragMetaRef.current;
      const container = listContainerRef.current;
      if (meta && container) {
        const rect = container.getBoundingClientRect();
        const edgeThreshold = 48;
        let scrolled = false;
        if (meta.lastClientY < rect.top + edgeThreshold && container.scrollTop > 0) {
          container.scrollTop = Math.max(0, container.scrollTop - 8);
          scrolled = true;
        } else if (meta.lastClientY > rect.bottom - edgeThreshold) {
          container.scrollTop += 8;
          scrolled = true;
        }
        if (scrolled) {
          const scrollDelta = container.scrollTop - meta.initialScrollTop;
          const effectiveY = meta.lastClientY + scrollDelta;
          const deltaY = effectiveY - meta.startClientY;
          let hoverIndex = meta.startIndex;
          if (deltaY < 0) {
            for (let i = 0; i < meta.startIndex; i++) {
              if (effectiveY < meta.midYs[i]) {
                hoverIndex = i;
                break;
              }
            }
          } else if (deltaY > 0) {
            for (let i = meta.midYs.length - 1; i > meta.startIndex; i--) {
              if (effectiveY > meta.midYs[i]) {
                hoverIndex = i;
                break;
              }
            }
          }
          meta.hoverIndex = hoverIndex;
          setDragState({
            itemId: meta.itemId,
            startIndex: meta.startIndex,
            hoverIndex,
            deltaY,
            itemHeight: meta.itemHeight
          });
        }
      }
      rafId = requestAnimationFrame(tickAutoScroll);
    };

    rafId = requestAnimationFrame(tickAutoScroll);
    return () => cancelAnimationFrame(rafId);
  }, [Boolean(dragState)]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const meta = dragMetaRef.current;
      if (!meta) return;
      e.preventDefault();
      meta.lastClientY = e.clientY;
      const scrollDelta = (listContainerRef.current?.scrollTop || 0) - meta.initialScrollTop;
      const effectiveY = e.clientY + scrollDelta;
      const deltaY = effectiveY - meta.startClientY;

      let hoverIndex = meta.startIndex;
      if (deltaY < 0) {
        for (let i = 0; i < meta.startIndex; i++) {
          if (effectiveY < meta.midYs[i]) {
            hoverIndex = i;
            break;
          }
        }
      } else if (deltaY > 0) {
        for (let i = meta.midYs.length - 1; i > meta.startIndex; i--) {
          if (effectiveY > meta.midYs[i]) {
            hoverIndex = i;
            break;
          }
        }
      }

      meta.hoverIndex = hoverIndex;
      setDragState({
        itemId: meta.itemId,
        startIndex: meta.startIndex,
        hoverIndex,
        deltaY,
        itemHeight: meta.itemHeight
      });
    };

    const finishDrag = () => {
      const meta = dragMetaRef.current;
      if (!meta) return;
      dragMetaRef.current = null;
      setDragState(null);

      if (meta.hoverIndex !== meta.startIndex) {
        const currentItems = itemsLatestRef.current;
        if (
          meta.startIndex >= 0 &&
          meta.startIndex < currentItems.length &&
          meta.hoverIndex >= 0 &&
          meta.hoverIndex < currentItems.length
        ) {
          const next = [...currentItems];
          const [moved] = next.splice(meta.startIndex, 1);
          next.splice(meta.hoverIndex, 0, moved);
          onUpdateItemsRef.current(next);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, []);

  const handleStartDrag = (e: React.PointerEvent, itemId: string, index: number) => {
    if (searchQuery.trim()) {
      onShowToast?.('Clear your search first before moving items.', 'info');
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const midYs: number[] = items.map((it) => {
      const el = rowElementRefs.current[it.id];
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    const activeEl = rowElementRefs.current[itemId];
    const itemHeight = activeEl ? activeEl.getBoundingClientRect().height : 64;
    const initialScrollTop = listContainerRef.current?.scrollTop || 0;

    dragMetaRef.current = {
      itemId,
      startIndex: index,
      hoverIndex: index,
      startClientY: e.clientY,
      lastClientY: e.clientY,
      initialScrollTop,
      itemHeight,
      midYs
    };

    setSelectedItemId(itemId);
    setDragState({
      itemId,
      startIndex: index,
      hoverIndex: index,
      deltaY: 0,
      itemHeight
    });
  };

  // Auto-scroll Rundown as we start events or go through segments
  useEffect(() => {
    if (activeItemIndex >= 0 && itemRefs.current[activeItemIndex]) {
      itemRefs.current[activeItemIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [activeItemIndex, isTimerRunning]);

  // Dedicated Event Edit Modal State (with Audio Notes & Category Color)
  const [modalForm, setModalForm] = useState<{
    id: string;
    segmentNumber: string;
    title: string;
    presenter: string;
    durationStr: string;
    notes: string;
    audioNotes: string;
    color?: string;
    status: RundownItem['status'];
  } | null>(null);

  const openEditModal = (item: RundownItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedItemId(item.id);
    setModalForm({
      id: item.id,
      segmentNumber: item.segmentNumber,
      title: item.title,
      presenter: item.presenter,
      durationStr: formatTime(item.durationSec),
      notes: item.notes,
      audioNotes: item.audioNotes || '',
      color: item.color || 'cyan',
      status: item.status
    });
  };

  const handleSaveModal = () => {
    if (!modalForm) return;
    const durSec = Math.max(10, parseTimeToSeconds(modalForm.durationStr) || 180);
    handleItemChange(modalForm.id, {
      segmentNumber: modalForm.segmentNumber,
      title: modalForm.title,
      presenter: modalForm.presenter,
      durationSec: durSec,
      notes: modalForm.notes,
      audioNotes: modalForm.audioNotes,
      color: modalForm.color || 'cyan',
      status: modalForm.status
    });
    setModalForm(null);
  };

  // Calculate cumulative planned start times for each row based on plannedStartTime
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

  // Selected item index calculation
  const selectedIndex = useMemo(() => {
    if (selectedItemId) {
      const idx = items.findIndex(it => it.id === selectedItemId);
      if (idx >= 0) return idx;
    }
    return Math.min(activeItemIndex, Math.max(0, items.length - 1));
  }, [items, selectedItemId, activeItemIndex]);

  const selectedItem = items[selectedIndex] || items[0];

  // Overall show stats
  const totalDurationSec = useMemo(() => {
    return items.reduce((acc, item) => acc + item.durationSec, 0);
  }, [items]);

  const plannedEndTime = useMemo(() => {
    return addSecondsToClockTime(plannedStartTime, totalDurationSec);
  }, [plannedStartTime, totalDurationSec]);

  const completedCount = useMemo(() => {
    return items.filter(it => it.status === 'done').length;
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return scheduledItems;
    const q = searchQuery.toLowerCase();
    return scheduledItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.presenter.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        (item.audioNotes && item.audioNotes.toLowerCase().includes(q)) ||
        item.segmentNumber.toLowerCase().includes(q)
    );
  }, [scheduledItems, searchQuery]);

  // Handlers for modifying items
  const handleItemChange = (id: string, updates: Partial<RundownItem>) => {
    const updated = items.map(item => (item.id === id ? { ...item, ...updates } : item));
    onUpdateItems(updated);
  };

  // Insert segment either BEFORE or AFTER the selected event, or at the end
  const handleInsertSegment = (position: 'before' | 'after' | 'end', targetIndex?: number) => {
    const targetIdx = targetIndex !== undefined ? targetIndex : selectedIndex;
    const target = items[targetIdx];

    let insertIdx = items.length;
    let newSegNum = String(items.length + 1).padStart(2, '0');

    if (position === 'before' && target) {
      insertIdx = Math.max(0, targetIdx);
      newSegNum = `${target.segmentNumber}A`;
    } else if (position === 'after' && target) {
      insertIdx = targetIdx + 1;
      newSegNum = `${target.segmentNumber}B`;
    }

    const newItem: RundownItem = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      segmentNumber: newSegNum,
      title: target
        ? `New Item (${position === 'before' ? 'Above' : position === 'after' ? 'Below' : ''} #${target.segmentNumber})`
        : `New Item ${items.length + 1}`,
      presenter: '',
      durationSec: 180,
      notes: '',
      audioNotes: '',
      color: target?.color || 'emerald',
      status: 'pending'
    };

    const nextItems = [...items];
    nextItems.splice(insertIdx, 0, newItem);
    onUpdateItems(nextItems);
    setSelectedItemId(newItem.id);
    setEditingId(newItem.id);
    setIsAddMenuOpen(false);
    setIsQuickAddMenuOpen(false);
  };

  const handleDeleteSegment = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (items.length <= 1) {
      onShowToast?.('Schedule must keep at least one item.', 'info');
      return;
    }
    const target = items.find(i => i.id === id);
    const updated = items.filter(i => i.id !== id);
    onUpdateItems(updated);
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
    if (modalForm && modalForm.id === id) {
      setModalForm(null);
    }
    onShowToast?.(`Removed #${target?.segmentNumber || ''} ${target?.title || 'item'}`, 'info');
  };

  const handleDuplicateSegment = (item: RundownItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const idx = items.findIndex(i => i.id === item.id);
    const duplicated: RundownItem = {
      ...item,
      id: `seg-${Date.now()}`,
      segmentNumber: `${item.segmentNumber}B`,
      title: `${item.title} (Copy)`,
      color: item.color,
      audioNotes: item.audioNotes || '',
      status: 'pending'
    };
    const next = [...items];
    next.splice(idx + 1, 0, duplicated);
    onUpdateItems(next);
  };

  const handleQuickDuration = (id: string, deltaSec: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newDur = Math.max(10, item.durationSec + deltaSec);
    handleItemChange(id, { durationSec: newDur });
  };

  const handleStatusCycle = (item: RundownItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const sequence: RundownItem['status'][] = ['pending', 'cue', 'live', 'done', 'skipped'];
    const curIdx = sequence.indexOf(item.status);
    const nextStatus = sequence[(curIdx + 1) % sequence.length];
    handleItemChange(item.id, { status: nextStatus });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 select-none overflow-hidden text-slate-200">
      {/* Top Toolbar */}
      <div className="px-2.5 sm:px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 z-10 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-xs font-semibold text-slate-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden xs:inline">SCHEDULE</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] sm:text-[11px] font-mono text-slate-300">
              {items.length}
            </span>
          </div>

          {/* Start Time Control */}
          <div className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded text-xs border border-slate-700/60 transition-colors">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 text-[10px] sm:text-[11px]">START:</span>
            <input
              type="text"
              value={plannedStartTime}
              onChange={(e) => onUpdatePlannedStartTime(e.target.value)}
              className="w-14 sm:w-16 bg-transparent text-cyan-300 font-mono font-semibold text-center focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded text-xs"
              title="Show start time (HH:MM:SS)"
            />
            {!isSplitMode && (
              <button
                onClick={() => onUpdatePlannedStartTime(getCurrentTimeOfDay())}
                className="text-[9px] sm:text-[10px] text-slate-400 hover:text-white px-1 py-0.5 rounded hover:bg-slate-700 font-mono"
                title="Set start time to right now"
              >
                NOW
              </button>
            )}
          </div>
        </div>

        {/* Action Button: Add Item above / below selected */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Selected item indicator (desktop full screen only) */}
          {!isSplitMode && selectedItem && (
            <div
              className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
              title="Selected item where new items will be added"
            >
              <span className="text-slate-500 text-[10px]">SELECTED:</span>
              <span className="text-cyan-300 font-bold truncate max-w-[120px]">
                #{selectedItem.segmentNumber} {selectedItem.title}
              </span>
            </div>
          )}

          {/* Direct 1-Tap Offline File Importer */}
          {!isSplitMode && (
            <div className="relative inline-flex items-center">
              <input
                ref={directFileInputRef}
                type="file"
                accept="*/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,.xlsx,.xls,.csv,.tsv,.ods"
                onChange={handleDirectFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                title="Pick a file from your device (.xlsx, .csv)"
              />
              <button
                type="button"
                onClick={handleTriggerDirectImport}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-600 hover:to-cyan-600 active:from-teal-800 active:to-cyan-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 border border-cyan-500/30 select-none"
                title="Pick a file from your device (.xlsx, .csv)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-200 pointer-events-none" />
                <span className="hidden xs:inline pointer-events-none">Upload File</span>
                <span className="xs:hidden pointer-events-none">Upload</span>
              </button>
            </div>
          )}

          {/* Backup & Restore Button */}
          {!isSplitMode && onOpenBackupModal && (
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-700 hover:to-indigo-600 active:from-purple-900 active:to-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 border border-purple-500/30 select-none"
              title="Save a backup file or restore an old show"
            >
              <Download className="w-3.5 h-3.5 text-purple-200 pointer-events-none" />
              <span className="hidden sm:inline pointer-events-none">Backup</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
              title="Add a new item above or below the selected one"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
              <ChevronDown className={`w-3 h-3 text-emerald-200 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAddMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsAddMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 p-2 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
                    <span>SELECTED ITEM:</span>
                    <strong className="text-cyan-300 truncate max-w-[150px]">
                      #{selectedItem?.segmentNumber || '01'} {selectedItem?.title}
                    </strong>
                  </div>

                  <button
                    onClick={() => handleInsertSegment('before')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-left cursor-pointer transition-colors group mb-1"
                  >
                    <span className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-950 text-cyan-400 border border-slate-700 group-hover:border-cyan-600 shrink-0">
                      <ArrowUpToLine className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-cyan-300 flex items-center justify-between">
                        <span>Add Above</span>
                        <span className="text-[10px] font-mono text-cyan-400">#{selectedItem?.segmentNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Place right above #{selectedItem?.segmentNumber}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleInsertSegment('after')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-left cursor-pointer transition-colors group mb-1"
                  >
                    <span className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-950 text-emerald-400 border border-slate-700 group-hover:border-emerald-600 shrink-0">
                      <ArrowDownToLine className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-emerald-300 flex items-center justify-between">
                        <span>Add Below</span>
                        <span className="text-[10px] font-mono text-emerald-400">#{selectedItem?.segmentNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Place right below #{selectedItem?.segmentNumber}
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={() => handleInsertSegment('end')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left cursor-pointer transition-colors text-slate-400 hover:text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                    <span>Add at the End</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subheader Search and Quick Filter */}
      {!isSplitMode && (
        <div className="px-2.5 sm:px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-400 shrink-0">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Search items, speakers, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 text-slate-200 placeholder-slate-500 pl-8 pr-2 py-1 rounded text-xs border border-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] font-mono shrink-0">
            <span>
              TOTAL: <strong className="text-white font-semibold">{formatTime(totalDurationSec, true)}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              ENDS AT: <strong className="text-cyan-300 font-semibold">{plannedEndTime}</strong>
            </span>
          </div>
        </div>
      )}


      {/* Main Schedule List */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 divide-y divide-slate-800/50 relative"
      >
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-4">
            <p className="text-sm">No schedule items found</p>
            <button
              onClick={() => handleInsertSegment('end')}
              className="mt-3 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium cursor-pointer"
            >
              Add First Item
            </button>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isCurrentActive = index === activeItemIndex;
            const isLive = isCurrentActive && isTimerRunning;
            const isCue = index === activeItemIndex + 1 || item.status === 'cue';
            const isEditing = editingId === item.id;
            const isSelected = item.id === (selectedItemId || items[activeItemIndex]?.id);
            const itemColor = getSegmentColor(item.color) || SEGMENT_COLOR_PALETTES.cyan;

            // Calculate countdown progress relative to the active live segment's total duration
            const curRemaining = isCurrentActive && typeof timeRemaining === 'number'
              ? timeRemaining
              : (isCurrentActive ? 0 : item.durationSec);
            const curDuration = isCurrentActive && typeof timerDuration === 'number' && timerDuration > 0
              ? timerDuration
              : item.durationSec;
            const progressPercent = curDuration > 0
              ? Math.min(100, Math.max(0, ((curDuration - curRemaining) / curDuration) * 100))
              : 0;

            const isDraggingThis = dragState?.itemId === item.id;
            let rowTranslateY = 0;
            if (dragState) {
              if (isDraggingThis) {
                rowTranslateY = dragState.deltaY;
              } else if (
                dragState.startIndex < dragState.hoverIndex &&
                index > dragState.startIndex &&
                index <= dragState.hoverIndex
              ) {
                rowTranslateY = -dragState.itemHeight;
              } else if (
                dragState.startIndex > dragState.hoverIndex &&
                index >= dragState.hoverIndex &&
                index < dragState.startIndex
              ) {
                rowTranslateY = dragState.itemHeight;
              }
            }

            if (isSplitMode) {
              // UNCLUTTERED, HIGH-VISIBILITY SPLIT VIEW ROW: Title & Notes prioritized!
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                    rowElementRefs.current[item.id] = el;
                  }}
                  onClick={() => setSelectedItemId(item.id)}
                  style={{
                    transform: rowTranslateY !== 0 ? `translateY(${rowTranslateY}px)` : undefined
                  }}
                  className={`group relative flex items-start justify-between p-2.5 pl-3 gap-2 overflow-hidden border-b ${
                    isDraggingThis
                      ? 'z-40 shadow-2xl ring-2 ring-cyan-400 bg-slate-800 scale-[1.01] opacity-95'
                      : dragState
                      ? 'transition-transform duration-150 cursor-pointer'
                      : 'transition-all cursor-pointer'
                  } ${
                    isSelected && !isDraggingThis ? 'ring-1 ring-cyan-400 shadow-md ' : ''
                  }${
                    isLive
                      ? 'bg-emerald-950/70 border-emerald-900/60 shadow-sm'
                      : isCurrentActive
                      ? 'bg-slate-800/95 border-cyan-800/60'
                      : isCue
                      ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                      : item.status === 'done'
                      ? 'bg-slate-950/60 border-slate-900 opacity-60 hover:opacity-100 hover:bg-slate-900'
                      : 'bg-slate-900/90 border-slate-800/80 hover:bg-slate-850'
                  }`}
                >
                  {/* Colored side-stripe for visual segment categorization */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-2 ${itemColor.stripeColor} transition-colors z-20`}
                    title={`Category: ${itemColor.name}`}
                  />

                  {/* Ambient progress tint across the currently active/live segment */}
                  {isCurrentActive && (
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500/15 pointer-events-none transition-all duration-300 ease-linear z-0"
                      style={{ width: `${progressPercent}%` }}
                    />
                  )}

                  {/* Visual countdown progress bar inside active live segment */}
                  {isCurrentActive && (
                    <div className="absolute bottom-0 left-2 right-0 h-1 bg-slate-950/90 overflow-hidden z-20">
                      <div
                        className={`h-full transition-all duration-300 ease-linear ${
                          curRemaining <= 15
                            ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse'
                            : curRemaining <= 30
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Touch Drag Handle (Split Mode) */}
                  <button
                    type="button"
                    onPointerDown={(e) => handleStartDrag(e, item.id, index)}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className={`relative z-20 flex items-center justify-center self-center min-w-[30px] min-h-[40px] rounded-lg touch-none select-none shrink-0 transition-colors ${
                      searchQuery.trim()
                        ? 'opacity-25 cursor-not-allowed text-slate-600'
                        : isDraggingThis
                        ? 'bg-cyan-500/30 text-cyan-300 cursor-grabbing'
                        : 'text-slate-500 hover:text-cyan-300 hover:bg-slate-800/80 active:bg-cyan-950 cursor-grab'
                    }`}
                    title="Tap & drag up or down to move"
                    aria-label={`Drag to move item ${item.title}`}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  {/* Left Column: Item Title & Notes without Clutter */}
                  <div className="flex-1 min-w-0 pr-1 relative z-10 space-y-1">
                    {/* Top Row: Item #, LIVE badge, Category */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-400 shrink-0">
                        #{item.segmentNumber}
                      </span>

                      {/* Distinct Pulsing LIVE Indicator Badge */}
                      {isCurrentActive && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold tracking-wider bg-rose-600 text-white shadow-xs shrink-0 border border-rose-400/50 animate-pulse"
                          title="Currently Running Live"
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                          </span>
                          <span>LIVE</span>
                        </span>
                      )}

                      {/* Type Dot & Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold shrink-0 ${itemColor.badgeBg} ${itemColor.badgeText} border ${itemColor.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${itemColor.dotColor}`} />
                        <span>{itemColor.name}</span>
                      </span>

                      {/* Speaker (if present) */}
                      {item.presenter && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-medium px-1.5 py-0.2 rounded bg-amber-950/40 border border-amber-800/40 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{item.presenter}</span>
                        </span>
                      )}
                    </div>

                    {/* Item Title - Full legible prominence */}
                    <h3
                      onClick={(e) => openEditModal(item, e)}
                      className={`text-sm sm:text-base font-bold leading-snug cursor-pointer hover:text-cyan-300 transition-colors break-words ${
                        isLive
                          ? 'text-white'
                          : item.status === 'done'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-100'
                      }`}
                      title="Tap to edit item"
                    >
                      {item.title}
                    </h3>

                    {/* Notes & Instructions */}
                    {item.notes && (
                      <div
                        onClick={(e) => openEditModal(item, e)}
                        className="text-xs text-amber-200/90 font-normal bg-amber-950/40 px-2 py-1 rounded-md border border-amber-800/40 mt-1 cursor-pointer hover:bg-amber-950/60 transition-colors flex items-start gap-1.5"
                        title="Notes (tap to edit)"
                      >
                        <span className="text-amber-400 shrink-0 text-xs">🎬</span>
                        <span className="leading-relaxed break-words flex-1">{item.notes}</span>
                      </div>
                    )}

                    {/* Sound & Mic Note */}
                    {item.audioNotes && (
                      <div
                        onClick={(e) => openEditModal(item, e)}
                        className="text-xs text-slate-200 font-normal bg-slate-800/70 px-2 py-1 rounded-md border border-slate-700/60 mt-1 cursor-pointer hover:bg-slate-800 transition-colors flex items-start gap-1.5"
                        title="Sound Note (tap to edit)"
                      >
                        <span className="shrink-0 text-xs">🔊</span>
                        <span className="leading-relaxed break-words flex-1">{item.audioNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Essential Controls Only (Length + 1-Tap GO + Edit) */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2 pl-1 relative z-10">
                    {/* Length badge: counts down in real-time sync with main stage timer */}
                    <button
                      type="button"
                      onClick={(e) => openEditModal(item, e)}
                      className={`font-digital text-xs sm:text-sm font-bold px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                        isCurrentActive
                          ? curRemaining <= 15
                            ? 'bg-rose-950/90 text-rose-400 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse'
                            : curRemaining <= 30
                            ? 'bg-amber-950/90 text-amber-300 border-amber-500'
                            : 'bg-emerald-950/90 text-emerald-300 border-emerald-500'
                          : 'bg-slate-950/90 text-cyan-300 border-slate-800 hover:border-cyan-500'
                      }`}
                      title={isCurrentActive ? `Time left: ${formatTime(curRemaining)} (Length: ${formatTime(item.durationSec)})` : 'Tap to edit length'}
                    >
                      {isCurrentActive ? formatTime(curRemaining) : formatTime(item.durationSec)}
                    </button>

                    {/* 1-Tap GO / LIVE Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAndStartItem(index);
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
                        isCurrentActive
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400 ring-2 ring-emerald-400/50'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white active:bg-cyan-700'
                      }`}
                      title="Start this item now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrentActive ? 'LIVE' : 'GO'}</span>
                    </button>

                    {/* Compact Edit pencil */}
                    <button
                      type="button"
                      onClick={(e) => openEditModal(item, e)}
                      className="p-1 text-slate-500 hover:text-cyan-300 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Edit Item Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // Normal Full Screen Mode row rendering
            return (
              <div
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                  rowElementRefs.current[item.id] = el;
                }}
                onClick={() => {
                  setSelectedItemId(item.id);
                }}
                style={{
                  transform: rowTranslateY !== 0 ? `translateY(${rowTranslateY}px)` : undefined
                }}
                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-2.5 pl-3 sm:pl-3.5 gap-1.5 sm:gap-2 overflow-hidden ${
                  isDraggingThis
                    ? 'z-40 shadow-2xl ring-2 ring-cyan-400 bg-slate-800 scale-[1.01] opacity-95'
                    : dragState
                    ? 'transition-transform duration-150 cursor-pointer'
                    : 'transition-all cursor-pointer'
                } ${
                  isSelected && !isDraggingThis ? 'ring-1 ring-cyan-400/90 shadow-md ' : ''
                }${
                  isLive
                    ? 'bg-emerald-950/60 shadow-sm'
                    : isCurrentActive
                    ? 'bg-slate-800/90'
                    : isCue
                    ? 'bg-slate-900/70 hover:bg-slate-800/50'
                    : item.status === 'done'
                    ? 'bg-slate-950/50 opacity-60 hover:opacity-100 hover:bg-slate-800/40'
                    : 'bg-slate-900/80 hover:bg-slate-800/50'
                }`}
              >
                {/* Visual colored side-stripe for categorizing segments */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 ${itemColor.stripeColor} transition-colors z-20`}
                  title={`Category: ${itemColor.name}`}
                />

                {/* Ambient progress tint across the currently active/live segment */}
                {isCurrentActive && (
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500/10 pointer-events-none transition-all duration-300 ease-linear z-0"
                    style={{ width: `${progressPercent}%` }}
                  />
                )}

                {/* Visual progress bar inside active live segment */}
                {isCurrentActive && (
                  <div className="absolute bottom-0 left-1.5 sm:left-2 right-0 h-1 sm:h-1.5 bg-slate-950/90 overflow-hidden z-20">
                    <div
                      className={`h-full transition-all duration-300 ease-linear ${
                        curRemaining <= 15
                          ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse'
                          : curRemaining <= 30
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                {/* Left Meta & Content */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 relative z-10">
                  {/* Touch Drag Handle (Full Screen / Phone Mode) */}
                  <button
                    type="button"
                    onPointerDown={(e) => handleStartDrag(e, item.id, index)}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center justify-center min-w-[32px] min-h-[38px] rounded-lg touch-none select-none shrink-0 transition-colors ${
                      searchQuery.trim()
                        ? 'opacity-25 cursor-not-allowed text-slate-600'
                        : isDraggingThis
                        ? 'bg-cyan-500/30 text-cyan-300 cursor-grabbing'
                        : 'text-slate-500 hover:text-cyan-300 hover:bg-slate-800/80 active:bg-cyan-950 cursor-grab'
                    }`}
                    title="Tap & drag up or down to move"
                    aria-label={`Drag to move item ${item.title}`}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  {/* Status Indicator / Tap to Cycle */}
                  <button
                    onClick={(e) => handleStatusCycle(item, e)}
                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-transform active:scale-95 cursor-pointer shrink-0 ${
                      isLive
                        ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                        : item.status === 'done'
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-900/50'
                        : item.status === 'cue'
                        ? 'bg-amber-500 text-black font-bold'
                        : item.status === 'skipped'
                        ? 'bg-rose-950 text-rose-300 line-through'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title="Tap to change status: WAITING -> NEXT UP -> LIVE -> DONE -> SKIP"
                  >
                    {isLive ? 'LIVE' : getStatusLabel(item.status)}
                  </button>

                  {/* Distinct Pulsing LIVE Indicator Badge */}
                  {isCurrentActive && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold tracking-wider bg-rose-600 text-white shadow-sm shrink-0 border border-rose-400/50 animate-pulse"
                      title="Currently Running Live"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      <span>LIVE</span>
                    </span>
                  )}

                  {/* Item Number */}
                  <div className="w-6 sm:w-7 text-center font-mono font-bold text-xs text-slate-400 group-hover:text-cyan-400 shrink-0">
                    {item.segmentNumber}
                  </div>

                  {/* Center Content: Title, Speaker, Category & Notes */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={item.title}
                          onChange={(e) => handleItemChange(item.id, { title: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingId(null);
                          }}
                          className="w-full bg-slate-950 text-white font-medium text-xs sm:text-sm px-2 py-0.5 rounded border border-cyan-500 focus:outline-none"
                        />
                      ) : (
                        <h3
                          onClick={(e) => openEditModal(item, e)}
                          className={`text-xs sm:text-sm font-semibold truncate cursor-pointer hover:text-cyan-300 ${
                            isLive
                              ? 'text-white'
                              : item.status === 'done'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-100'
                          }`}
                        >
                          {item.title}
                        </h3>
                      )}
                    </div>

                    {/* Category Pill, Speaker, Notes, and Sound Note subrow */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs">
                      {/* Colored Type Tag Pill */}
                      <span
                        onClick={(e) => openEditModal(item, e)}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full ${itemColor.badgeBg} ${itemColor.badgeText} border ${itemColor.badgeBorder} text-[9px] sm:text-[10px] font-semibold cursor-pointer shrink-0 truncate max-w-[130px] hover:brightness-125 transition-all`}
                        title={`Type: ${itemColor.name} (tap to edit)`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${itemColor.dotColor} shrink-0`} />
                        <span className="truncate">{itemColor.name}</span>
                      </span>

                      {item.presenter ? (
                        <span 
                          onClick={(e) => openEditModal(item, e)}
                          className="text-amber-300 font-medium flex items-center gap-1 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/40 text-[10px] sm:text-[11px] truncate max-w-[130px] sm:max-w-none cursor-pointer"
                          title="Speaker / Host (tap to edit)"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate">{item.presenter}</span>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => openEditModal(item, e)}
                          className="text-[9px] sm:text-[10px] text-slate-500 hover:text-slate-300 italic cursor-pointer"
                        >
                          + Speaker
                        </button>
                      )}

                      {item.notes && (
                        <span
                          onClick={(e) => openEditModal(item, e)}
                          className="text-slate-400 text-[10px] sm:text-[11px] truncate max-w-[130px] sm:max-w-xs italic hover:text-slate-200 cursor-pointer"
                          title="Notes (tap to edit)"
                        >
                          🎬 "{item.notes}"
                        </span>
                      )}

                      {/* Basic Sound Note */}
                      {item.audioNotes && (
                        <span
                          onClick={(e) => openEditModal(item, e)}
                          className="text-slate-300 text-[10px] sm:text-[11px] truncate max-w-[130px] sm:max-w-xs italic hover:text-white cursor-pointer"
                          title="Sound Note (tap to edit)"
                        >
                          🔊 "{item.audioNotes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Controls: Duration & Action Buttons */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t border-slate-800/40 sm:border-0">
                  {/* Time of Day on larger screens */}
                  {!isSplitMode && (
                    <div className="hidden md:flex flex-col text-[10px] font-mono leading-tight text-slate-400 mr-1 text-right">
                      <span className="text-cyan-300 font-semibold">{item.calculatedStart}</span>
                      <span className="text-[9px] text-slate-500">to {item.calculatedEnd}</span>
                    </div>
                  )}

                  {/* Duration display with +/- quick modifiers (supports up to 60:00+) */}
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => handleQuickDuration(item.id, -30, e)}
                      className="text-[9px] sm:text-[10px] text-slate-500 hover:text-slate-200 px-1 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                      title="-30 seconds"
                    >
                      -30s
                    </button>
                    <button
                      type="button"
                      onClick={(e) => openEditModal(item, e)}
                      className={`font-digital text-xs sm:text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        isCurrentActive
                          ? curRemaining <= 15
                            ? 'text-rose-400 font-black animate-pulse bg-rose-950/70 border border-rose-500/50'
                            : curRemaining <= 30
                            ? 'text-amber-300 font-bold bg-amber-950/70 border border-amber-500/50'
                            : 'text-emerald-300 font-bold bg-emerald-950/70 border border-emerald-500/50'
                          : 'text-white hover:text-cyan-300'
                      }`}
                      title={isCurrentActive ? `Time left: ${formatTime(curRemaining)} (Length: ${formatTime(item.durationSec)})` : 'Tap to edit length (up to 60:00 min:sec)'}
                    >
                      {isCurrentActive ? formatTime(curRemaining) : formatTime(item.durationSec)}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleQuickDuration(item.id, 30, e)}
                      className="text-[9px] sm:text-[10px] text-slate-500 hover:text-slate-200 px-1 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                      title="+30 seconds"
                    >
                      +30s
                    </button>
                  </div>

                  {/* Quick GO / Start Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAndStartItem(index);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-transform active:scale-95 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-sm'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                    title="Start this item now"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isCurrentActive ? 'LIVE' : 'GO'}</span>
                  </button>

                  {/* Row Action Buttons */}
                  <div className="flex items-center gap-0.5 opacity-90 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(item, e)}
                      className="p-1 sm:p-1.5 text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 sm:bg-transparent rounded hover:bg-slate-800 cursor-pointer border border-cyan-800/40 sm:border-0"
                      title="Edit Item (Length, Speaker, Notes)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertSegment('before', index);
                      }}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 cursor-pointer"
                      title={`Add new item ABOVE #${item.segmentNumber}`}
                    >
                      <ArrowUpToLine className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertSegment('after', index);
                      }}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800 cursor-pointer"
                      title={`Add new item BELOW #${item.segmentNumber}`}
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDuplicateSegment(item, e)}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title="Copy item"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSegment(item.id, e)}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status Bar */}
      {isSplitMode ? (
        <div className="px-2.5 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-bold">{completedCount}/{items.length} Done</span>
          </div>
          <div className="flex items-center gap-2">
            <span>TOTAL: <strong className="text-white font-semibold">{formatTime(totalDurationSec, true)}</strong></span>
            <span className="text-slate-600">|</span>
            <span>ENDS: <strong className="text-cyan-300 font-semibold">{plannedEndTime}</strong></span>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 font-mono">
          <div className="flex items-center gap-2">
            <span>DONE:</span>
            <span className="text-white font-bold">
              {completedCount}/{items.length}
            </span>
            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden ml-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-500">
              TOTAL TIME: <span className="text-slate-300">{formatTime(totalDurationSec)}</span>
            </span>

            {/* Quick Add with Above / Below dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsQuickAddMenuOpen(!isQuickAddMenuOpen)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer active:scale-95 transition-transform"
                title="Add item above or below selected"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add</span>
                <ChevronUp className={`w-3 h-3 text-emerald-400 transition-transform ${isQuickAddMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isQuickAddMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsQuickAddMenuOpen(false)} />
                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 p-2 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
                      <span>NEXT TO #{selectedItem?.segmentNumber || '01'}</span>
                      <span className="text-cyan-300 truncate max-w-[100px]">{selectedItem?.title}</span>
                    </div>
                    <button
                      onClick={() => handleInsertSegment('before')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-800 text-left cursor-pointer transition-colors text-white hover:text-cyan-300 group"
                    >
                      <span className="flex items-center gap-1.5">
                        <ArrowUpToLine className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Add Above Selected</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">#{selectedItem?.segmentNumber}</span>
                    </button>
                    <button
                      onClick={() => handleInsertSegment('after')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-800 text-left cursor-pointer transition-colors text-white hover:text-emerald-300 group"
                    >
                      <span className="flex items-center gap-1.5">
                        <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Add Below Selected</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">#{selectedItem?.segmentNumber}</span>
                    </button>
                    <button
                      onClick={() => handleInsertSegment('end')}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left cursor-pointer transition-colors text-slate-400 hover:text-slate-200 border-t border-slate-800 mt-1 pt-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add at the End</span>
                      </span>
                      <span className="text-[10px] font-mono">End</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Details Edit Modal */}
      {modalForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700 font-mono text-xs font-bold">
                  ITEM {modalForm.segmentNumber}
                </span>
                <h2 className="font-display font-bold text-sm sm:text-base text-white">Edit Item</h2>
              </div>
              <button
                onClick={() => setModalForm(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 sm:space-y-4 text-xs sm:text-sm">
              {/* Title & Item Number */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-mono text-slate-400 mb-1">Item #</label>
                  <input
                    type="text"
                    value={modalForm.segmentNumber}
                    onChange={(e) => setModalForm({ ...modalForm, segmentNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-mono text-slate-400 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-cyan-500"
                    placeholder="Item name or title"
                  />
                </div>
              </div>

              {/* Speaker / Host */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Speaker / Host</label>
                <input
                  type="text"
                  value={modalForm.presenter}
                  onChange={(e) => setModalForm({ ...modalForm, presenter: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Host, guest, or speaker name"
                />
              </div>

              {/* Time Length Editor */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-semibold text-cyan-300">
                    Length (min:sec — up to 60:00)
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatTime(parseTimeToSeconds(modalForm.durationStr) || 0)}
                  </span>
                </div>

                {/* Big, Unobstructed Duration Input Box */}
                <input
                  type="text"
                  value={modalForm.durationStr}
                  onChange={(e) => setModalForm({ ...modalForm, durationStr: e.target.value })}
                  className="w-full min-h-[48px] bg-slate-900 border-2 border-cyan-500/60 rounded-xl px-4 py-2.5 text-white font-digital font-extrabold text-xl sm:text-2xl text-center tracking-wider focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 shadow-inner"
                  placeholder="05:00"
                />

                {/* Quick +/- Time Adjustments on their own row */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseTimeToSeconds(modalForm.durationStr) || 180;
                      setModalForm({ ...modalForm, durationStr: formatTime(Math.max(10, cur - 60)) });
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-mono font-bold border border-slate-700 cursor-pointer transition-all"
                    title="-1 minute"
                  >
                    -1m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseTimeToSeconds(modalForm.durationStr) || 180;
                      setModalForm({ ...modalForm, durationStr: formatTime(Math.max(10, cur - 30)) });
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-mono font-bold border border-slate-700 cursor-pointer transition-all"
                    title="-30 seconds"
                  >
                    -30s
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseTimeToSeconds(modalForm.durationStr) || 180;
                      setModalForm({ ...modalForm, durationStr: formatTime(cur + 30) });
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-mono font-bold border border-slate-700 cursor-pointer transition-all"
                    title="+30 seconds"
                  >
                    +30s
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseTimeToSeconds(modalForm.durationStr) || 180;
                      setModalForm({ ...modalForm, durationStr: formatTime(cur + 60) });
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-mono font-bold border border-slate-700 cursor-pointer transition-all"
                    title="+1 minute"
                  >
                    +1m
                  </button>
                </div>

                {/* Preset duration buttons including 10s, 15s, 30s and up to 60:00 */}
                <div className="space-y-1.5 pt-0.5">
                  <span className="block text-[10px] text-slate-400 font-mono uppercase">Quick Presets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: '10s', value: '00:10', sec: 10 },
                      { label: '15s', value: '00:15', sec: 15 },
                      { label: '30s', value: '00:30', sec: 30 },
                      { label: '01:00', value: '01:00', sec: 60 },
                      { label: '03:00', value: '03:00', sec: 180 },
                      { label: '05:00', value: '05:00', sec: 300 },
                      { label: '10:00', value: '10:00', sec: 600 },
                      { label: '15:00', value: '15:00', sec: 900 },
                      { label: '30:00', value: '30:00', sec: 1800 },
                      { label: '45:00', value: '45:00', sec: 2700 },
                      { label: '60:00', value: '60:00', sec: 3600 }
                    ].map(p => {
                      const isPresetActive = parseTimeToSeconds(modalForm.durationStr) === p.sec;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setModalForm({ ...modalForm, durationStr: p.value })}
                          className={`px-2.5 py-1.5 rounded-lg font-mono text-xs border cursor-pointer transition-all active:scale-95 ${
                            isPresetActive
                              ? 'bg-cyan-950 text-cyan-200 border-cyan-400 font-bold shadow-xs'
                              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Item Type & Color Tag */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Item Type &amp; Color</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">Color Stripe</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {Object.entries(SEGMENT_COLOR_PALETTES).map(([key, pal]) => {
                    const isSelected = (modalForm.color || 'cyan').toLowerCase() === key.toLowerCase();
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setModalForm({ ...modalForm, color: key })}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? `${pal.badgeBg} ${pal.badgeText} border-cyan-400 ring-1 ring-cyan-500/40 shadow-xs font-bold scale-[1.02]`
                            : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${pal.dotColor} shrink-0`} />
                        <span className="text-[11px] truncate">{pal.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Status</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['pending', 'cue', 'live', 'done', 'skipped'] as RundownItem['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalForm({ ...modalForm, status: st })}
                      className={`py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer border ${
                        modalForm.status === st
                          ? st === 'live'
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : st === 'cue'
                            ? 'bg-amber-500 text-black border-amber-400'
                            : st === 'done'
                            ? 'bg-slate-700 text-emerald-300 border-slate-600'
                            : st === 'skipped'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {getStatusLabel(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes & Instructions */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  🎬 Notes &amp; Instructions
                </label>
                <textarea
                  rows={2}
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="Camera cues, graphics, video notes, or reminders"
                />
              </div>

              {/* Basic Sound & Mic Note */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  🔊 Sound &amp; Mic Note
                </label>
                <textarea
                  rows={2}
                  value={modalForm.audioNotes}
                  onChange={(e) => setModalForm({ ...modalForm, audioNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Host mic live, play background music"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (modalForm) {
                    handleDeleteSegment(modalForm.id);
                  }
                }}
                disabled={items.length <= 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-800/80 hover:bg-rose-950/80 text-rose-300 disabled:opacity-30 text-xs font-semibold cursor-pointer transition-colors"
                title="Remove this item from the schedule"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Item</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalForm(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer shadow-md active:scale-95 transition-transform"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
