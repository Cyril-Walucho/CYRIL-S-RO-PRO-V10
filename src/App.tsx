/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RundownItem, SessionState, TimerState } from './types/rundown';
import { RundownView } from './components/RundownView';
import { TimerView } from './components/TimerView';
import { AndroidFrame } from './components/AndroidFrame';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { CsvImportExportModal } from './components/CsvImportExportModal';
import { TemplatesModal } from './components/TemplatesModal';
import { FoldableControlsModal } from './components/FoldableControlsModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { ProfilesModal } from './components/ProfilesModal';
import { ShareDisplayModal } from './components/ShareDisplayModal';
import { TalentStageDisplay } from './components/TalentStageDisplay';
import { RundownBackupModal } from './components/RundownBackupModal';
import { AboutModal } from './components/AboutModal';
import { ProfileStorage, RundownProfile, DEFAULT_PROFILES } from './utils/profileStorage';
import { parseCSV, csvToRundownItems } from './utils/csvParser';
import { useFoldableDetection } from './utils/useFoldableDetection';
import { useOrientationDetection } from './utils/useOrientationDetection';
import { LandscapeRotationModal } from './components/LandscapeRotationModal';
import { SplashLoadingScreen } from './components/SplashLoadingScreen';
import { ArrowUpDown, ArrowLeftRight } from 'lucide-react';
import { getApiBaseUrl, isApkEnvironment, isOnlineEnabled } from './utils/apiConfig';

// Safe server sync helper: strictly disabled on APK (never fires fetch in APK)
const syncServer = (url: string, options?: RequestInit) => {
  if (!isOnlineEnabled() || isApkEnvironment()) return;
  fetch(url, options).catch(() => {});
};


export default function App() {
  // Customizable Studio Display Name (persisted in localStorage)
  const [appDisplayName, setAppDisplayName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cyril_ro_display_name') || "CYRIL'S RUNDOWN";
    }
    return "CYRIL'S RUNDOWN";
  });

  const handleUpdateDisplayName = (name: string) => {
    const trimmed = name.trim() || "CYRIL'S RUNDOWN";
    setAppDisplayName(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cyril_ro_display_name', trimmed);
    }
  };

  // 1-Second Full-Page Initial Loading Screen
  const [showInitialSplash, setShowInitialSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowInitialSplash(false), []);

  // Session ID from URL or default "main"
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('session') || 'main';
    }
    return 'main';
  });

  // Dedicated Talent / Stage Monitor Link View Mode
  const [isTalentOnlyMode, setIsTalentOnlyMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'talent' || params.get('view') === 'talent' || params.get('view') === 'stage';
    }
    return false;
  });

  // Multiple Profiles of Different Rundowns & Events (Offline & APK Persistent)
  const [profiles, setProfiles] = useState<RundownProfile[]>(() => ProfileStorage.getProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => ProfileStorage.getActiveProfileId());

  // Active Profile object
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

  // Retrieve last saved active events set from storage (defaults to the last events set, not resetting to preset templates)
  const lastSavedState = typeof window !== 'undefined' ? ProfileStorage.getLastActiveState(sessionId) : null;

  // Foldable Phone Detection & Configuration
  const { foldableConfig, updateFoldableConfig } = useFoldableDetection();
  const [isFoldableModalOpen, setIsFoldableModalOpen] = useState(false);

  // Auto-Rotation and Landscape Orientation Detection
  const {
    isLandscape,
    landscapeMode,
    changeLandscapeMode,
    showRotationPrompt,
    openRotationPrompt,
    dismissRotationPrompt
  } = useOrientationDetection();

  // Core Rundown State (Defaults to last saved events set from sheets/excel or edits)
  const [sessionTitle, setSessionTitle] = useState(
    lastSavedState?.title || activeProfile.name || "Cyril Walucho's Rundown Live Free"
  );
  const [plannedStartTime, setPlannedStartTime] = useState(
    lastSavedState?.plannedStartTime || activeProfile.plannedStartTime || '19:00:00'
  );
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    lastSavedState?.googleSheetUrl !== undefined ? lastSavedState.googleSheetUrl : (activeProfile.googleSheetUrl || '')
  );
  const [autoSyncSheet, setAutoSyncSheet] = useState(
    lastSavedState?.autoSyncSheet !== undefined ? lastSavedState.autoSyncSheet : (!!activeProfile.autoSyncSheet)
  );
  const [syncIntervalSec, setSyncIntervalSec] = useState(
    lastSavedState?.syncIntervalSec || activeProfile.syncIntervalSec || 15
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(
    lastSavedState?.lastSyncedAt ?? activeProfile.lastSyncedAt
  );
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  const [items, setItems] = useState<RundownItem[]>(() => {
    if (lastSavedState && Array.isArray(lastSavedState.items) && lastSavedState.items.length > 0) {
      return lastSavedState.items;
    }
    return activeProfile.items && activeProfile.items.length > 0 ? activeProfile.items : DEFAULT_PROFILES[0].items;
  });
  const initialDuration = items[0]?.durationSec || 180;

  const [timer, setTimer] = useState<TimerState>({
    activeItemIndex: 0,
    isRunning: false,
    timeRemaining: initialDuration,
    duration: initialDuration,
    isOvertime: false,
    startedAt: null,
    pausedAt: null,
    elapsedInSegment: 0,
    showStartTime: null,
    autoAdvance: false,
    flashAlert: false
  });

  // Maintain sync references to latest items and timer to prevent stale closure bugs
  const itemsRef = useRef<RundownItem[]>(items);
  itemsRef.current = items;
  const timerRef = useRef<TimerState>(timer);
  timerRef.current = timer;

  // UI Views and Modals
  const [activeTab, setActiveTab] = useState<'split' | 'rundown' | 'timer'>('rundown');
  const [isStageMode, setIsStageMode] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage for left rundown
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [isShareDisplayModalOpen, setIsShareDisplayModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  interface ToastState {
    msg: string;
    type: 'success' | 'info' | 'error';
  }
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    // Suppress network error alerts on APK
    if (isApkEnvironment() && type === 'error' && (
      msg.toLowerCase().includes('fetch') ||
      msg.toLowerCase().includes('network') ||
      msg.toLowerCase().includes('connect') ||
      msg.toLowerCase().includes('sync')
    )) {
      return;
    }
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Global unhandled network rejection suppressor on APK
  useEffect(() => {
    if (isApkEnvironment()) {
      const handleRejection = (e: PromiseRejectionEvent) => {
        e.preventDefault();
      };
      window.addEventListener('unhandledrejection', handleRejection);
      return () => window.removeEventListener('unhandledrejection', handleRejection);
    }
  }, []);

  // Timestamp of last local user action to prevent stale server SSE echoes from overriding live state
  const lastLocalActionRef = useRef<number>(0);

  // 1. Initial Session Load & Server-Sent Events (SSE) Live Multi-device Sync (Web only)
  useEffect(() => {
    if (!isOnlineEnabled() || isApkEnvironment()) {
      return;
    }
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      fetch(`${getApiBaseUrl()}/api/session/${sessionId}`)
        .then(res => res.json())
        .then((data: SessionState & { isDefault?: boolean }) => {
          if (data) {
            const localSaved = ProfileStorage.getLastActiveState(sessionId);
            const hasLocalCustomEvents = !!(localSaved && (localSaved.isCustomized || (localSaved.items && localSaved.items.length > 0)));

            // If the server session is just the default template and the client has saved custom events from sheets/excel/edits:
            if (data.isDefault && hasLocalCustomEvents && localSaved) {
              fetch(`${getApiBaseUrl()}/api/session/${sessionId}/rundown`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: localSaved.title,
                  plannedStartTime: localSaved.plannedStartTime,
                  googleSheetUrl: localSaved.googleSheetUrl,
                  autoSyncSheet: localSaved.autoSyncSheet,
                  syncIntervalSec: localSaved.syncIntervalSec,
                  lastSyncedAt: localSaved.lastSyncedAt,
                  items: localSaved.items,
                  isDefault: false,
                  updatedAt: localSaved.updatedAt || Date.now()
                })
              }).catch(() => {});
              return;
            }

            if (data.title) setSessionTitle(data.title);
            if (data.plannedStartTime) setPlannedStartTime(data.plannedStartTime);
            if (data.googleSheetUrl !== undefined) setGoogleSheetUrl(data.googleSheetUrl);
            if (data.autoSyncSheet !== undefined) setAutoSyncSheet(data.autoSyncSheet);
            if (data.syncIntervalSec) setSyncIntervalSec(data.syncIntervalSec);
            if (data.lastSyncedAt) setLastSyncedAt(data.lastSyncedAt);
            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items);
              itemsRef.current = data.items;
              if (!data.isDefault) {
                ProfileStorage.saveLastActiveState({
                  sessionId,
                  title: data.title || sessionTitle,
                  plannedStartTime: data.plannedStartTime || plannedStartTime,
                  googleSheetUrl: data.googleSheetUrl || '',
                  autoSyncSheet: !!data.autoSyncSheet,
                  syncIntervalSec: data.syncIntervalSec || 15,
                  lastSyncedAt: data.lastSyncedAt,
                  items: data.items,
                  activeProfileId,
                  isCustomized: true
                });
              }
            }
            if (data.timer) {
              setTimer(data.timer);
              timerRef.current = data.timer;
            }
          }
        })
        .catch(err => {
          console.log('Session initial fetch offline fallback:', err);
        });

      try {
        eventSource = new EventSource(`${getApiBaseUrl()}/api/session/${sessionId}/events`);
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.session) {
              const s: SessionState & { isDefault?: boolean } = parsed.session;
              const localSaved = ProfileStorage.getLastActiveState(sessionId);
              if (parsed.type === 'INIT' && s.isDefault && localSaved?.isCustomized) {
                return;
              }
              if (s.title) setSessionTitle(s.title);
              if (s.plannedStartTime) setPlannedStartTime(s.plannedStartTime);
              if (s.googleSheetUrl !== undefined) setGoogleSheetUrl(s.googleSheetUrl);
              if (s.autoSyncSheet !== undefined) setAutoSyncSheet(s.autoSyncSheet);
              if (s.syncIntervalSec) setSyncIntervalSec(s.syncIntervalSec);
              if (s.lastSyncedAt) setLastSyncedAt(s.lastSyncedAt);
              if (Array.isArray(s.items) && s.items.length > 0) {
                // If the user just locally triggered an action, do not let an older SSE overwrite items
                if (Date.now() - lastLocalActionRef.current >= 2000) {
                  setItems(s.items);
                  itemsRef.current = s.items;
                }
              }
              if (s.timer) {
                // Avoid overwriting a freshly started local live segment timer with an older SSE echo
                if (Date.now() - lastLocalActionRef.current >= 2000) {
                  setTimer(s.timer);
                  timerRef.current = s.timer;
                }
              }
            }
          } catch {
            // ignore heartbeats
          }
        };
        eventSource.onerror = () => {
          eventSource?.close();
        };
      } catch {}
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [sessionId]);

  // 2. High-Precision Local Timer Ticker with Instant Auto-Advance & Zero-Glitch Switching
  useEffect(() => {
    if (!timer.isRunning) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (!prev.isRunning) return prev;

        const nextRemaining = prev.timeRemaining - 1;

        // Check if current segment timer has run out (0 or negative)
        if (nextRemaining <= 0) {
          // AUTO ADVANCE: automatically go to the next event when timer runs out
          if (prev.autoAdvance) {
            const curIdx = prev.activeItemIndex;
            const currentItems = itemsRef.current;
            const nextIdx = curIdx + 1;

            if (nextIdx < currentItems.length) {
              const nextItem = currentItems[nextIdx];
              const nextDur = nextItem.durationSec;

              const updatedItems = currentItems.map((item, i) => {
                if (i <= curIdx) return { ...item, status: 'done' as const };
                if (i === nextIdx) return { ...item, status: 'live' as const };
                return item;
              });
              setItems(updatedItems);
              itemsRef.current = updatedItems;

              const nextTimerState: TimerState = {
                ...prev,
                activeItemIndex: nextIdx,
                duration: nextDur,
                timeRemaining: nextDur,
                isOvertime: false,
                isRunning: true,
                startedAt: Date.now()
              };
              timerRef.current = nextTimerState;

              syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/timer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'auto-advance',
                  activeItemIndex: nextIdx,
                  timeRemaining: nextDur,
                  duration: nextDur,
                  isRunning: true,
                  isOvertime: false,
                  autoAdvance: true
                })
              });

              return nextTimerState;
            } else {
              // Last event reached: finish show
              const updatedItems = currentItems.map(item => ({ ...item, status: 'done' as const }));
              setItems(updatedItems);
              itemsRef.current = updatedItems;

              const finalTimerState: TimerState = {
                ...prev,
                timeRemaining: 0,
                isRunning: false,
                isOvertime: false
              };
              timerRef.current = finalTimerState;

              syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/timer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'pause',
                  timeRemaining: 0,
                  isRunning: false,
                  isOvertime: false
                })
              });

              return finalTimerState;
            }
          }
        }

        const updated = {
          ...prev,
          timeRemaining: nextRemaining,
          isOvertime: nextRemaining < 0
        };
        timerRef.current = updated;
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.activeItemIndex, timer.autoAdvance, sessionId]);

  // 3. Periodic Background Google Sheet Sync (Web only)
  useEffect(() => {
    if (!isOnlineEnabled() || isApkEnvironment()) return;
    if (!googleSheetUrl || !autoSyncSheet) return;

    const pollInterval = setInterval(() => {
      triggerSheetSync(false);
    }, (syncIntervalSec || 15) * 1000);

    return () => clearInterval(pollInterval);
  }, [googleSheetUrl, autoSyncSheet, syncIntervalSec]);

  const triggerSheetSync = useCallback(async (isUserInitiated: boolean = true) => {
    if (!isOnlineEnabled() || isApkEnvironment()) return;
    if (!googleSheetUrl) return;
    setIsSyncingSheet(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/proxy-sheet?url=${encodeURIComponent(googleSheetUrl)}`);
      if (!res.ok) throw new Error('Sheet sync failed');
      const csvText = await res.text();
      const rows = parseCSV(csvText);
      const parsedItems = csvToRundownItems(rows);

      if (parsedItems.length > 0) {
        setItems(parsedItems);
        const now = Date.now();
        setLastSyncedAt(now);

        // Update active profile in local storage for offline preservation
        const curProfile = ProfileStorage.getActiveProfile();
        if (curProfile) {
          ProfileStorage.upsertProfile({
            ...curProfile,
            items: parsedItems,
            lastSyncedAt: now
          });
          setProfiles(ProfileStorage.getProfiles());
        }

        ProfileStorage.saveLastActiveState({
          sessionId,
          title: sessionTitle,
          plannedStartTime,
          googleSheetUrl,
          autoSyncSheet,
          syncIntervalSec,
          lastSyncedAt: now,
          items: parsedItems,
          activeProfileId,
          isCustomized: true
        });

        syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/rundown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sessionTitle,
            plannedStartTime,
            googleSheetUrl,
            autoSyncSheet,
            syncIntervalSec,
            items: parsedItems,
            lastSyncedAt: now,
            isDefault: false
          })
        });
      }
    } catch {
      if (isUserInitiated) {
        showToast('Could not sync with Google Sheet. Please check the share permissions.', 'error');
      }
    } finally {
      setIsSyncingSheet(false);
    }
  }, [googleSheetUrl, sessionId, sessionTitle, plannedStartTime, autoSyncSheet, syncIntervalSec, activeProfileId]);

  // 4. Keyboard Shortcuts for Live Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTimerAction(timer.isRunning ? 'pause' : 'start');
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleTimerAction('next');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleTimerAction('prev');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleTimerAction('reset');
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsStageMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer.isRunning, timer.activeItemIndex, items.length]);

  // 5. Rundown Item Updates & Offline-First Local Storage Sync
  const handleUpdateItems = async (newItems: RundownItem[]) => {
    const currentActiveId = itemsRef.current[timerRef.current.activeItemIndex]?.id;
    setItems(newItems);

    if (currentActiveId) {
      const movedIndex = newItems.findIndex(item => item.id === currentActiveId);
      if (movedIndex !== -1 && movedIndex !== timerRef.current.activeItemIndex) {
        setTimer(prev => ({ ...prev, activeItemIndex: movedIndex }));
      } else if (movedIndex === -1 && newItems.length > 0 && timerRef.current.activeItemIndex >= newItems.length) {
        setTimer(prev => ({ ...prev, activeItemIndex: newItems.length - 1 }));
      }
    }

    // Save immediately as the last events set so refresh defaults to the last events set
    ProfileStorage.saveLastActiveState({
      sessionId,
      title: sessionTitle,
      plannedStartTime,
      googleSheetUrl,
      autoSyncSheet,
      syncIntervalSec,
      lastSyncedAt,
      items: newItems,
      activeProfileId,
      isCustomized: true
    });

    // Save immediately to ProfileStorage (offline APK persistence)
    const curProfile = ProfileStorage.getActiveProfile();
    if (curProfile) {
      ProfileStorage.upsertProfile({
        ...curProfile,
        items: newItems,
        updatedAt: Date.now()
      });
      setProfiles(ProfileStorage.getProfiles());
    }

    syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/rundown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sessionTitle,
        plannedStartTime,
        googleSheetUrl,
        autoSyncSheet,
        syncIntervalSec,
        lastSyncedAt,
        items: newItems,
        isDefault: false
      })
    });
  };

  const handleUpdatePlannedStartTime = async (time: string) => {
    setPlannedStartTime(time);

    ProfileStorage.saveLastActiveState({
      sessionId,
      title: sessionTitle,
      plannedStartTime: time,
      googleSheetUrl,
      autoSyncSheet,
      syncIntervalSec,
      lastSyncedAt,
      items,
      activeProfileId,
      isCustomized: true
    });

    const curProfile = ProfileStorage.getActiveProfile();
    if (curProfile) {
      ProfileStorage.upsertProfile({
        ...curProfile,
        plannedStartTime: time,
        updatedAt: Date.now()
      });
      setProfiles(ProfileStorage.getProfiles());
    }

    syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/rundown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plannedStartTime: time,
        isDefault: false
      })
    });
  };

  // 6. Profile Switcher & Event Management
  const handleSelectProfile = (newProfileId: string) => {
    // 1. Save currently active profile first
    const curProfile = profiles.find(p => p.id === activeProfileId);
    if (curProfile) {
      ProfileStorage.upsertProfile({
        ...curProfile,
        items,
        plannedStartTime,
        googleSheetUrl,
        autoSyncSheet,
        syncIntervalSec,
        lastSyncedAt,
        updatedAt: Date.now()
      });
    }

    // 2. Activate target profile
    const target = profiles.find(p => p.id === newProfileId);
    if (!target) return;

    ProfileStorage.setActiveProfileId(newProfileId);
    setActiveProfileId(newProfileId);
    setSessionTitle(target.name);
    setPlannedStartTime(target.plannedStartTime || '19:00:00');
    setGoogleSheetUrl(target.googleSheetUrl || '');
    setAutoSyncSheet(!!target.autoSyncSheet);
    if (target.syncIntervalSec) setSyncIntervalSec(target.syncIntervalSec);
    setItems(target.items);

    ProfileStorage.saveLastActiveState({
      sessionId,
      title: target.name,
      plannedStartTime: target.plannedStartTime || '19:00:00',
      googleSheetUrl: target.googleSheetUrl || '',
      autoSyncSheet: !!target.autoSyncSheet,
      syncIntervalSec: target.syncIntervalSec || 15,
      lastSyncedAt: target.lastSyncedAt,
      items: target.items,
      activeProfileId: newProfileId,
      isCustomized: true
    });

    // Reset timer for newly activated profile
    const firstDur = target.items[0]?.durationSec || 180;
    setTimer({
      activeItemIndex: 0,
      isRunning: false,
      timeRemaining: firstDur,
      duration: firstDur,
      isOvertime: false,
      startedAt: null,
      pausedAt: null,
      elapsedInSegment: 0,
      showStartTime: null,
      autoAdvance: false,
      flashAlert: false
    });

    // Sync to backend if online
    syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/rundown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: target.name,
        items: target.items,
        plannedStartTime: target.plannedStartTime || '19:00:00',
        googleSheetUrl: target.googleSheetUrl || ''
      })
    });

    showToast(`Loaded show: "${target.name}"`, 'success');
  };

  const handleProfilesUpdated = (updatedList: RundownProfile[]) => {
    setProfiles(updatedList);
  };

  // 7. Timer Actions Handler
  const handleTimerAction = async (action: 'start' | 'pause' | 'reset' | 'next' | 'prev' | 'flash') => {
    lastLocalActionRef.current = Date.now();

    const currentTimer = timerRef.current;
    const currentItems = itemsRef.current;
    let nextTimer = { ...currentTimer };

    if (action === 'start') {
      nextTimer.isRunning = true;
      nextTimer.startedAt = Date.now();
      if (!nextTimer.showStartTime) nextTimer.showStartTime = Date.now();
      const nextItems = [...currentItems];
      if (nextItems[currentTimer.activeItemIndex]) {
        nextItems[currentTimer.activeItemIndex].status = 'live';
        setItems(nextItems);
      }
    } else if (action === 'pause') {
      nextTimer.isRunning = false;
      nextTimer.pausedAt = Date.now();
    } else if (action === 'reset') {
      nextTimer.isRunning = false;
      const cur = currentItems[currentTimer.activeItemIndex];
      const dur = cur ? cur.durationSec : 180;
      nextTimer.duration = dur;
      nextTimer.timeRemaining = dur;
      nextTimer.isOvertime = false;
    } else if (action === 'next') {
      const curIdx = currentTimer.activeItemIndex;
      const nextIdx = curIdx + 1;
      if (nextIdx < currentItems.length) {
        nextTimer.activeItemIndex = nextIdx;
        const dur = currentItems[nextIdx].durationSec;
        nextTimer.duration = dur;
        nextTimer.timeRemaining = dur;
        nextTimer.isOvertime = false;

        const nextItems = currentItems.map((item, i) => {
          if (i <= curIdx) return { ...item, status: 'done' as const };
          if (i === nextIdx) return { ...item, status: currentTimer.isRunning ? 'live' as const : 'cue' as const };
          return item;
        });
        setItems(nextItems);
      }
    } else if (action === 'prev') {
      const curIdx = currentTimer.activeItemIndex;
      const prevIdx = curIdx - 1;
      if (prevIdx >= 0) {
        nextTimer.activeItemIndex = prevIdx;
        const dur = currentItems[prevIdx].durationSec;
        nextTimer.duration = dur;
        nextTimer.timeRemaining = dur;
        nextTimer.isOvertime = false;

        const nextItems = currentItems.map((item, i) => {
          if (i === prevIdx) return { ...item, status: currentTimer.isRunning ? 'live' as const : 'cue' as const };
          return item;
        });
        setItems(nextItems);
      }
    } else if (action === 'flash') {
      nextTimer.flashAlert = true;
      setTimeout(() => {
        setTimer(t => ({ ...t, flashAlert: false }));
      }, 1500);
    }

    setTimer(nextTimer);

    syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/timer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        activeItemIndex: nextTimer.activeItemIndex,
        timeRemaining: nextTimer.timeRemaining,
        duration: nextTimer.duration,
        isRunning: nextTimer.isRunning,
        isOvertime: nextTimer.isOvertime,
        autoAdvance: nextTimer.autoAdvance
      })
    });
  };

  const handleAdjustTimer = async (deltaSeconds: number) => {
    setTimer(prev => {
      const newRemaining = prev.timeRemaining + deltaSeconds;
      const updated = {
        ...prev,
        timeRemaining: newRemaining,
        duration: Math.max(10, prev.duration + deltaSeconds),
        isOvertime: newRemaining < 0
      };

      syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRemaining: updated.timeRemaining,
          duration: updated.duration,
          isOvertime: updated.isOvertime
        })
      });

      return updated;
    });
  };

  const handleSelectAndStartItem = (index: number) => {
    lastLocalActionRef.current = Date.now();
    const currentItems = itemsRef.current;
    const targetItem = currentItems[index];
    if (!targetItem) return;

    const nextItems = currentItems.map((it, i) => {
      if (i === index) return { ...it, status: 'live' as const };
      if (i < index && it.status !== 'done') return { ...it, status: 'done' as const };
      return it;
    });
    setItems(nextItems);
    itemsRef.current = nextItems;

    const updatedTimer: TimerState = {
      ...timerRef.current,
      activeItemIndex: index,
      isRunning: true,
      timeRemaining: targetItem.durationSec,
      duration: targetItem.durationSec,
      isOvertime: false,
      startedAt: Date.now()
    };
    timerRef.current = updatedTimer;
    setTimer(updatedTimer);

    syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/timer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'jump',
        activeItemIndex: index,
        timeRemaining: targetItem.durationSec,
        duration: targetItem.durationSec,
        isRunning: true,
        isOvertime: false
      })
    });
  };

  const handleCueItem = (index: number) => {
    const nextItems = itemsRef.current.map((it, i) => (i === index ? { ...it, status: 'cue' as const } : it));
    handleUpdateItems(nextItems);
  };

  const handleToggleAutoAdvance = () => {
    setTimer(prev => {
      const nextVal = !prev.autoAdvance;
      syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAdvance: nextVal })
      });

      if (nextVal && prev.isRunning && prev.timeRemaining <= 0) {
        const curIdx = prev.activeItemIndex;
        const currentItems = itemsRef.current;
        const nextIdx = curIdx + 1;
        if (nextIdx < currentItems.length) {
          const nextItem = currentItems[nextIdx];
          const nextDur = nextItem.durationSec;
          const updatedItems = currentItems.map((item, i) => {
            if (i <= curIdx) return { ...item, status: 'done' as const };
            if (i === nextIdx) return { ...item, status: 'live' as const };
            return item;
          });
          setItems(updatedItems);

          syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/timer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'auto-advance',
              activeItemIndex: nextIdx,
              timeRemaining: nextDur,
              duration: nextDur,
              isRunning: true,
              isOvertime: false,
              autoAdvance: true
            })
          });

          return {
            ...prev,
            autoAdvance: true,
            activeItemIndex: nextIdx,
            duration: nextDur,
            timeRemaining: nextDur,
            isOvertime: false
          };
        }
      }

      return { ...prev, autoAdvance: nextVal };
    });
  };

  const handleSaveSheetConfig = async (
    url: string,
    autoSync: boolean,
    interval: number,
    newItems?: RundownItem[]
  ) => {
    setGoogleSheetUrl(url);
    setAutoSyncSheet(autoSync);
    setSyncIntervalSec(interval);

    let updatedItems = items;
    const now = Date.now();
    if (newItems && newItems.length > 0) {
      updatedItems = newItems;
      setItems(newItems);
      setLastSyncedAt(now);
    }

    ProfileStorage.saveLastActiveState({
      sessionId,
      title: sessionTitle,
      plannedStartTime,
      googleSheetUrl: url,
      autoSyncSheet: autoSync,
      syncIntervalSec: interval,
      items: updatedItems,
      lastSyncedAt: now,
      activeProfileId,
      isCustomized: true
    });

    const curProfile = ProfileStorage.getActiveProfile();
    if (curProfile) {
      ProfileStorage.upsertProfile({
        ...curProfile,
        googleSheetUrl: url,
        autoSyncSheet: autoSync,
        syncIntervalSec: interval,
        items: updatedItems,
        lastSyncedAt: now
      });
      setProfiles(ProfileStorage.getProfiles());
    }

    syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/rundown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sessionTitle,
        plannedStartTime,
        googleSheetUrl: url,
        autoSyncSheet: autoSync,
        syncIntervalSec: interval,
        items: updatedItems,
        lastSyncedAt: now,
        isDefault: false
      })
    });
  };

  const handleSessionChange = (newSessionId: string) => {
    setSessionId(newSessionId);
    const url = new URL(window.location.href);
    url.searchParams.set('session', newSessionId);
    window.history.pushState({}, '', url.toString());
  };

  // Render Talent / Stage Display View directly if requested via sharable link
  if (isTalentOnlyMode) {
    return (
      <TalentStageDisplay
        sessionId={sessionId}
        items={items}
        timer={timer}
        plannedStartTime={plannedStartTime}
        displayName={appDisplayName}
      />
    );
  }

  // Render Rundown View component
  const renderRundownComponent = (isSplitMode: boolean = false) => (
    <RundownView
      items={items}
      activeItemIndex={timer.activeItemIndex}
      plannedStartTime={plannedStartTime}
      isTimerRunning={timer.isRunning}
      timeRemaining={timer.timeRemaining}
      timerDuration={timer.duration}
      googleSheetUrl={googleSheetUrl}
      autoSyncSheet={autoSyncSheet}
      isSyncingSheet={isSyncingSheet}
      onUpdateItems={handleUpdateItems}
      onUpdatePlannedStartTime={handleUpdatePlannedStartTime}
      onSelectAndStartItem={handleSelectAndStartItem}
      onCueItem={handleCueItem}
      onOpenSheetModal={() => setIsSheetModalOpen(true)}
      onOpenCsvModal={() => setIsCsvModalOpen(true)}
      onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
      onTriggerSync={() => triggerSheetSync(true)}
      activeProfileName={activeProfile.name}
      onOpenProfilesModal={() => setIsProfilesModalOpen(true)}
      onOpenShareDisplayModal={() => setIsShareDisplayModalOpen(true)}
      onOpenBackupModal={() => setIsBackupModalOpen(true)}
      isSplitMode={isSplitMode}
      onShowToast={showToast}
    />
  );

  // Render Timer View component
  const renderTimerComponent = (stageMode: boolean = false, isFoldableSplit: boolean = false, isSplitMode: boolean = false) => (
    <TimerView
      timer={timer}
      items={items}
      isStageMode={stageMode}
      isFoldableSplit={isFoldableSplit}
      isSplitMode={isSplitMode}
      onToggleStageMode={() => setIsStageMode(!isStageMode)}
      onTimerAction={handleTimerAction}
      onAdjustTimer={handleAdjustTimer}
      onToggleAutoAdvance={handleToggleAutoAdvance}
      showPlannedStartTime={plannedStartTime}
    />
  );

  return (
    <>
      {/* Initial Full-Page Loading Screen */}
      {showInitialSplash && (
        <SplashLoadingScreen
          displayName={appDisplayName}
          durationMs={2000}
          onComplete={handleSplashComplete}
        />
      )}

      <AndroidFrame
        sessionId={sessionId}
        isStageMode={isStageMode}
        onToggleStageMode={() => setIsStageMode(!isStageMode)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        foldableConfig={foldableConfig}
        onOpenFoldableModal={() => setIsFoldableModalOpen(true)}
        onQuickToggleFoldable={() => updateFoldableConfig({ isFoldableMode: !foldableConfig.isFoldableMode })}
        onSwapFoldHalves={() => updateFoldableConfig({ swapHalves: !foldableConfig.swapHalves })}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        activeProfileName={activeProfile.name}
        onOpenProfilesModal={() => setIsProfilesModalOpen(true)}
        onOpenShareDisplayModal={() => setIsShareDisplayModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        isLandscape={isLandscape}
        landscapeMode={landscapeMode}
        onChangeLandscapeMode={changeLandscapeMode}
        onOpenRotationModal={openRotationPrompt}
        displayName={appDisplayName}
        onUpdateDisplayName={handleUpdateDisplayName}
        onUpdateFoldableConfig={updateFoldableConfig}
        autoAdvance={timer.autoAdvance}
        onToggleAutoAdvance={handleToggleAutoAdvance}
      >
        {/* 1. Full Stage Mode (Talent Monitor View) */}
        {isStageMode ? (
          <div className="h-full w-full">
            {renderTimerComponent(true)}
          </div>
        ) : foldableConfig.isFoldableMode ? (
          /* 2. Foldable Phone Mode (User can switch between Split, Stage, and Rundown modes) */
          foldableConfig.viewMode === 'stage' ? (
            <div className="h-full w-full overflow-hidden">
              {renderTimerComponent(true)}
            </div>
          ) : foldableConfig.viewMode === 'rundown' ? (
            <div className="h-full w-full overflow-hidden">
              {renderRundownComponent(false)}
            </div>
          ) : (
            /* Split View across the central hinge (Horizontal Left/Right by default or Vertical Top/Bottom) */
            foldableConfig.orientation === 'vertical' ? (
              /* Top Half & Bottom Half (Vertical Fold / Flex Mode / Tabletop) */
              <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950">
                {/* Top Half of Foldable Phone */}
                <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                  {foldableConfig.swapHalves ? renderRundownComponent(true) : renderTimerComponent(false, true, true)}
                </div>

                {/* Central Physical Hinge Crease Bar */}
                <div
                  style={{ minHeight: `${Math.max(18, foldableConfig.hingeGapPx)}px` }}
                  className="w-full bg-slate-950 border-y border-slate-700/60 flex items-center justify-center relative overflow-visible z-30 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] select-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-slate-800/50 to-black/80 pointer-events-none" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateFoldableConfig({ swapHalves: !foldableConfig.swapHalves });
                    }}
                    className="relative z-30 flex items-center gap-1.5 min-h-[34px] px-4 py-1.5 -my-2 rounded-full bg-slate-900 hover:bg-slate-800 active:bg-cyan-950 text-xs font-mono font-bold text-cyan-300 border-2 border-cyan-500/70 shadow-lg transition-transform active:scale-95 touch-manipulation cursor-pointer"
                    title="Tap to swap top and bottom views"
                    aria-label="Swap top and bottom views"
                  >
                    <ArrowUpDown className="w-4 h-4 text-cyan-300" />
                    <span>SWAP SIDES</span>
                  </button>
                </div>

                {/* Bottom Half of Foldable Phone */}
                <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                  {foldableConfig.swapHalves ? renderTimerComponent(false, true, true) : renderRundownComponent(true)}
                </div>
              </div>
            ) : (
              /* Left Half & Right Half (Horizontal Book Fold Mode - Default) */
              <div className="h-full w-full flex flex-row overflow-hidden bg-slate-950">
                {/* Left Half of Foldable Phone */}
                <div className="flex-1 min-w-0 h-full overflow-hidden relative">
                  {foldableConfig.swapHalves ? renderTimerComponent(false, false, true) : renderRundownComponent(true)}
                </div>

                {/* Central Vertical Hinge Crease */}
                <div
                  style={{ width: `${Math.max(20, foldableConfig.hingeGapPx)}px` }}
                  className="h-full bg-slate-950 border-x border-slate-700/60 flex flex-col items-center justify-center relative overflow-visible z-30 shrink-0 shadow-[inset_2px_0_4px_rgba(0,0,0,0.8)] select-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-slate-800/50 to-black/80 pointer-events-none" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateFoldableConfig({ swapHalves: !foldableConfig.swapHalves });
                    }}
                    className="relative z-30 flex flex-col items-center justify-center gap-0.5 w-11 h-14 -mx-3 rounded-full bg-slate-900 hover:bg-slate-800 active:bg-cyan-950 text-[8px] font-mono font-bold text-cyan-300 border-2 border-cyan-500/70 shadow-lg transition-transform active:scale-95 touch-manipulation cursor-pointer"
                    title="Tap to swap left and right views"
                    aria-label="Swap left and right views"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-cyan-300" />
                    <span className="leading-none">SWAP</span>
                  </button>
                </div>

                {/* Right Half of Foldable Phone */}
                <div className="flex-1 min-w-0 h-full overflow-hidden relative">
                  {foldableConfig.swapHalves ? renderRundownComponent(true) : renderTimerComponent(false, false, true)}
                </div>
              </div>
            )
          )
        ) : (
        /* 3. Standard Non-Foldable Mode (Auto-Rotated Landscape or Mobile Portrait) */
        isLandscape ? (
          /* Landscape Orientation Mode: Based on User Selection (Split 50/50, Stage Only, Rundown Only) */
          landscapeMode === 'stage' ? (
            <div className="h-full w-full overflow-hidden">
              {renderTimerComponent(true)}
            </div>
          ) : landscapeMode === 'rundown' ? (
            <div className="h-full w-full overflow-hidden">
              {renderRundownComponent()}
            </div>
          ) : (
            /* Split Screen (50/50) in Landscape */
            <div className="h-full w-full flex flex-row overflow-hidden">
              <div
                className="h-full min-h-0 overflow-hidden"
                style={{ width: `${splitRatio}%` }}
              >
                {renderRundownComponent(true)}
              </div>

              {/* Desktop/Tablet Resizable Split Handle */}
              <div
                className="flex items-center justify-center w-2 bg-slate-950 hover:bg-cyan-500/50 cursor-col-resize shrink-0 transition-colors group select-none border-x border-slate-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const newRatio = (moveEvent.clientX / window.innerWidth) * 100;
                    if (newRatio >= 25 && newRatio <= 75) {
                      setSplitRatio(Math.round(newRatio));
                    }
                  };
                  const handleMouseUp = () => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                  };
                  window.addEventListener('mousemove', handleMouseMove);
                  window.addEventListener('mouseup', handleMouseUp);
                }}
                title="Drag to resize Schedule and Timer"
              >
                <div className="w-0.5 h-8 bg-slate-700 group-hover:bg-cyan-400 rounded-full" />
              </div>

              <div className="h-full min-h-0 flex-1 overflow-hidden">
                {renderTimerComponent(false, false, true)}
              </div>
            </div>
          )
        ) : (
          /* Portrait Orientation Mode (Clean Mobile Phone Layout) */
          activeTab === 'split' ? (
            /* Split Top/Bottom in Portrait */
            <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950">
              <div className="h-1/2 min-h-0 w-full overflow-hidden border-b border-slate-800">
                {renderRundownComponent(true)}
              </div>
              <div className="h-1/2 min-h-0 w-full overflow-hidden">
                {renderTimerComponent(false, true, true)}
              </div>
            </div>
          ) : activeTab === 'timer' ? (
            <div className="h-full w-full overflow-hidden">
              {renderTimerComponent(false)}
            </div>
          ) : (
            <div className="h-full w-full overflow-hidden">
              {renderRundownComponent()}
            </div>
          )
        )
      )}

      {/* Modals */}
      <LandscapeRotationModal
        isOpen={showRotationPrompt}
        onClose={dismissRotationPrompt}
        currentMode={landscapeMode}
        onSelectMode={changeLandscapeMode}
      />

      <ProfilesModal
        isOpen={isProfilesModalOpen}
        onClose={() => setIsProfilesModalOpen(false)}
        profiles={profiles}

        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        onProfilesUpdated={handleProfilesUpdated}
      />

      <ShareDisplayModal
        isOpen={isShareDisplayModalOpen}
        onClose={() => setIsShareDisplayModalOpen(false)}
        sessionId={sessionId}
      />

      <FoldableControlsModal
        isOpen={isFoldableModalOpen}
        onClose={() => setIsFoldableModalOpen(false)}
        config={foldableConfig}
        onUpdateConfig={updateFoldableConfig}
      />

      <GoogleSheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        currentUrl={googleSheetUrl}
        autoSync={autoSyncSheet}
        syncIntervalSec={syncIntervalSec}
        lastSyncedAt={lastSyncedAt}
        onSaveConfig={handleSaveSheetConfig}
        onImportOfflineItems={(importedItems, mode, sourceName) => {
          const finalItems = mode === 'append' ? [...items, ...importedItems] : importedItems;
          const targetTitle = sourceName || sessionTitle;
          if (sourceName) setSessionTitle(sourceName);
          handleUpdateItems(finalItems);

          ProfileStorage.saveLastActiveState({
            sessionId,
            title: targetTitle,
            plannedStartTime,
            googleSheetUrl,
            autoSyncSheet,
            syncIntervalSec,
            lastSyncedAt: Date.now(),
            items: finalItems,
            activeProfileId,
            isCustomized: true
          });

          syncServer(`${getApiBaseUrl()}/api/session/${sessionId}/rundown`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: targetTitle,
              plannedStartTime,
              googleSheetUrl,
              autoSyncSheet,
              syncIntervalSec,
              items: finalItems,
              lastSyncedAt: Date.now(),
              isDefault: false
            })
          });

          showToast(`Loaded ${importedItems.length} items from your file!`, 'success');
        }}
      />

      <CsvImportExportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        items={items}
        onImportItems={handleUpdateItems}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={(templateItems) => {
          handleUpdateItems(templateItems);
          setTimer(t => ({
            ...t,
            activeItemIndex: 0,
            isRunning: false,
            timeRemaining: templateItems[0].durationSec,
            duration: templateItems[0].durationSec,
            isOvertime: false
          }));
        }}
      />

      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenStageMode={() => setIsStageMode(true)}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onOpenProfilesModal={() => setIsProfilesModalOpen(true)}
        displayName={appDisplayName}
      />

      <RundownBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title={sessionTitle}
        plannedStartTime={plannedStartTime}
        googleSheetUrl={googleSheetUrl}
        autoSyncSheet={autoSyncSheet}
        syncIntervalSec={syncIntervalSec}
        items={items}
        onRestoreCurrentProject={(backup) => {
          if (backup.title) setSessionTitle(backup.title);
          if (backup.plannedStartTime) setPlannedStartTime(backup.plannedStartTime);
          if (backup.googleSheetUrl !== undefined) setGoogleSheetUrl(backup.googleSheetUrl);
          if (backup.autoSyncSheet !== undefined) setAutoSyncSheet(backup.autoSyncSheet);
          if (backup.syncIntervalSec) setSyncIntervalSec(backup.syncIntervalSec);
          handleUpdateItems(backup.items);

          ProfileStorage.saveLastActiveState({
            sessionId,
            title: backup.title || sessionTitle,
            plannedStartTime: backup.plannedStartTime || plannedStartTime,
            googleSheetUrl: backup.googleSheetUrl || '',
            autoSyncSheet: !!backup.autoSyncSheet,
            syncIntervalSec: backup.syncIntervalSec || 15,
            items: backup.items,
            lastSyncedAt: Date.now(),
            activeProfileId,
            isCustomized: true
          });
        }}
        onImportAsNewProject={(newProfile) => {
          ProfileStorage.upsertProfile(newProfile);
          ProfileStorage.setActiveProfileId(newProfile.id);
          setProfiles(ProfileStorage.getProfiles());
          setActiveProfileId(newProfile.id);
          handleSelectProfile(newProfile.id);
        }}
        onShowToast={showToast}
      />

      {toast && (
        <div
          className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 border ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : toast.type === 'error'
              ? 'bg-rose-950 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              : 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === 'success'
                ? 'bg-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-400 animate-ping'
                : 'bg-cyan-400'
            }`}
          />
          <span>{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}
    </AndroidFrame>
    </>
  );
}
