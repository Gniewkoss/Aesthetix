import React, { useEffect, useRef, useState } from 'react';
import { TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface AnimatedTextCycleProps {
  /** Words to rotate through. A single-word array renders statically. */
  words: string[];
  /** Time each word stays on screen, in ms. */
  interval?: number;
  /** Text style applied to the cycling word (supports theme typography). */
  style?: StyleProp<TextStyle>;
  /** When true, skips the fade/slide and swaps words instantly (a11y). */
  reduceMotion?: boolean;
  /** Caps OS font scaling so the headline never breaks the layout. */
  maxFontSizeMultiplier?: number;
}

const FADE_OUT = 220;
const FADE_IN = 260;

/**
 * Cycles through `words` in place with a subtle fade + lift. Designed to be
 * dropped inline inside a larger headline (see Onboarding hero). Honors the
 * OS "Reduce Motion" setting via the `reduceMotion` prop.
 */
export default function AnimatedTextCycle({
  words,
  interval = 3000,
  style,
  reduceMotion = false,
  maxFontSizeMultiplier = 1.2,
}: AnimatedTextCycleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (words.length <= 1) return;

    const next = () => setCurrentIndex((prev) => (prev + 1) % words.length);

    const ticker = setInterval(() => {
      if (reduceMotion) {
        next();
        return;
      }

      opacity.value = withSequence(
        withTiming(0, { duration: FADE_OUT, easing: Easing.in(Easing.cubic) }),
        withTiming(1, { duration: FADE_IN, easing: Easing.out(Easing.cubic) })
      );
      translateY.value = withSequence(
        withTiming(-8, { duration: FADE_OUT, easing: Easing.in(Easing.cubic) }),
        withTiming(0, { duration: FADE_IN, easing: Easing.out(Easing.cubic) })
      );

      // Swap the word at the bottom of the fade so the change is invisible.
      swapTimer.current = setTimeout(next, FADE_OUT);
    }, interval);

    return () => {
      clearInterval(ticker);
      if (swapTimer.current) clearTimeout(swapTimer.current);
    };
  }, [interval, words.length, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text
      style={[style, animatedStyle]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      accessibilityRole="text"
    >
      {words[currentIndex]}
    </Animated.Text>
  );
}
