import { useEffect, useRef, useState } from 'react';
import {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';

interface Options {
  /** Real progress from backend (0–100) */
  target: number;
  /** When true, animate to 100 and stop creep */
  complete?: boolean;
}

/**
 * Drives a believable display progress: smooth easing toward backend updates,
 * gentle forward creep when stalled, and slower motion above ~85%.
 */
export function useSmoothedProgress({ target, complete = false }: Options) {
  const display = useSharedValue(0);
  const lastTarget = useRef(0);
  const creepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const goal = complete ? 100 : Math.max(0, Math.min(100, target));
    const delta = goal - lastTarget.current;
    lastTarget.current = goal;

    const duration =
      goal >= 95 ? 1400 : goal >= 85 ? 1100 : delta > 25 ? 900 : 750;

    display.value = withTiming(goal / 100, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, complete, display]);

  useEffect(() => {
    if (complete) {
      if (creepTimer.current) clearInterval(creepTimer.current);
      return;
    }

    creepTimer.current = setInterval(() => {
      const currentPct = display.value * 100;
      const cap = Math.min(target + 6, 93);
      if (currentPct < cap && currentPct < target + 1.5) {
        const next = Math.min(currentPct + 0.35, cap);
        display.value = withTiming(next / 100, {
          duration: 500,
          easing: Easing.linear,
        });
      }
    }, 140);

    return () => {
      if (creepTimer.current) clearInterval(creepTimer.current);
    };
  }, [target, complete, display]);

  return display;
}

/** Subscribe to display progress as a rounded 0–100 integer for React state */
export function useDisplayProgressPercent(display: ReturnType<typeof useSmoothedProgress>) {
  const [percent, setPercent] = useState(0);

  useAnimatedReaction(
    () => Math.round(display.value * 100),
    (next, prev) => {
      if (next !== prev) {
        runOnJS(setPercent)(next);
      }
    },
    [display],
  );

  return percent;
}
