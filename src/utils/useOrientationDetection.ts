import { useState, useEffect, useRef } from 'react';

export type LandscapeViewMode = 'split' | 'stage' | 'rundown';

export function useOrientationDetection() {
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return false;
  });

  const [landscapeMode, setLandscapeMode] = useState<LandscapeViewMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cyril_ro_landscape_mode');
        if (saved === 'split' || saved === 'stage' || saved === 'rundown') {
          return saved;
        }
      } catch {}
    }
    return 'split';
  });

  // Prompt the user when they rotate their device to landscape
  const [showRotationPrompt, setShowRotationPrompt] = useState<boolean>(false);
  const prevIsLandscapeRef = useRef<boolean>(isLandscape);

  useEffect(() => {
    const handleOrientationChange = () => {
      if (typeof window === 'undefined') return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const currentlyLandscape = w > h;

      // Do not popup modal on rotate; options are shown at the bottom dock
      prevIsLandscapeRef.current = currentlyLandscape;
      setIsLandscape(currentlyLandscape);
    };

    handleOrientationChange();

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    if (typeof screen !== 'undefined' && screen.orientation) {
      screen.orientation.addEventListener?.('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (typeof screen !== 'undefined' && screen.orientation) {
        screen.orientation.removeEventListener?.('change', handleOrientationChange);
      }
    };
  }, []);

  const changeLandscapeMode = (mode: LandscapeViewMode) => {
    setLandscapeMode(mode);
    setShowRotationPrompt(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cyril_ro_landscape_mode', mode);
      } catch {}
    }
  };

  return {
    isLandscape,
    landscapeMode,
    changeLandscapeMode,
    showRotationPrompt,
    openRotationPrompt: () => setShowRotationPrompt(true),
    dismissRotationPrompt: () => setShowRotationPrompt(false)
  };
}

