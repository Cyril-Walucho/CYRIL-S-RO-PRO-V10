import { useState, useEffect } from 'react';
import { FoldableConfig } from '../types/rundown';

export function useFoldableDetection() {
  const [config, setConfig] = useState<FoldableConfig>(() => {
    // Check saved preference if any
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('onair_foldable_config');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      isFoldableMode: false,
      orientation: 'horizontal', // default layout to left/right as requested
      swapHalves: false,
      hingeGapPx: 12,
      autoDetected: false,
      devicePreset: 'galaxy-fold',
      viewMode: 'split'
    };
  });

  useEffect(() => {
    const detectFoldable = () => {
      if (typeof window === 'undefined') return;

      let isDualScreen = false;
      let detectedOrientation: 'vertical' | 'horizontal' = 'vertical';

      // 1. W3C Viewport Segments API
      try {
        const hasVerticalSegments = window.matchMedia && window.matchMedia('(vertical-viewport-segments: 2)').matches;
        const hasHorizontalSegments = window.matchMedia && window.matchMedia('(horizontal-viewport-segments: 2)').matches;

        if (hasVerticalSegments) {
          isDualScreen = true;
          detectedOrientation = 'vertical';
        } else if (hasHorizontalSegments) {
          isDualScreen = true;
          detectedOrientation = 'horizontal';
        }
      } catch {}

      // 2. Device Posture API (Chrome/Samsung Internet)
      try {
        const posture = (navigator as any).devicePosture?.type;
        if (posture === 'folded' || posture === 'half-folded') {
          isDualScreen = true;
        }
      } catch {}

      // 3. Aspect Ratio & Dimension Heuristics for Unfolded Foldables in Portrait
      // Unfolded foldables in portrait typically have an aspect ratio (H/W) between 1.05 and 1.45,
      // with viewport width >= 600px and <= 1100px.
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = h >= w;
      const aspectRatio = h / Math.max(1, w);

      // Foldable unfolded aspect ratios:
      // Galaxy Z Fold 5/6 unfolded portrait: ~768 x 960 (ratio ~1.25)
      // Pixel Fold / Pixel 9 Pro Fold unfolded: ~840 x 1000 (ratio ~1.19)
      // OnePlus Open unfolded: ~828 x 994 (ratio ~1.2)
      if (isPortrait && w >= 600 && w <= 1150 && aspectRatio >= 1.05 && aspectRatio <= 1.45) {
        isDualScreen = true;
        detectedOrientation = 'vertical'; // top & bottom halves
      }

      if (isDualScreen) {
        setConfig(prev => ({
          ...prev,
          isFoldableMode: prev.isFoldableMode || isDualScreen,
          autoDetected: true,
          orientation: prev.orientation || detectedOrientation
        }));
      }
    };

    detectFoldable();

    window.addEventListener('resize', detectFoldable);

    // Device posture change event
    if (typeof navigator !== 'undefined' && (navigator as any).devicePosture) {
      (navigator as any).devicePosture.addEventListener?.('change', detectFoldable);
    }

    return () => {
      window.removeEventListener('resize', detectFoldable);
      if (typeof navigator !== 'undefined' && (navigator as any).devicePosture) {
        (navigator as any).devicePosture.removeEventListener?.('change', detectFoldable);
      }
    };
  }, []);

  const updateConfig = (updates: Partial<FoldableConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('onair_foldable_config', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return { foldableConfig: config, updateFoldableConfig: updateConfig };
}
