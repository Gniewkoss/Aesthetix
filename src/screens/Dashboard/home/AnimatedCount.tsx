import React, { useEffect, useMemo } from 'react';
import { TextInput, TextStyle, StyleProp, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { TIMING_FILL } from '../../../motion';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCountProps {
  value: number;
  style?: StyleProp<TextStyle>;
  /** When true, render the final value immediately (reduced motion). */
  instant?: boolean;
}

/** TextInput auto-width clips trailing digits (e.g. 100 → "10") without a floor. */
function minWidthForDigits(value: number, style: StyleProp<TextStyle>): number {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontSize = flat?.fontSize ?? 60;
  const letterSpacing = typeof flat?.letterSpacing === 'number' ? flat.letterSpacing : 0;
  const digits = Math.max(1, String(Math.round(Math.abs(value))).length);
  const charWidth = fontSize * 0.62 + letterSpacing;
  return Math.ceil(charWidth * digits) + 10;
}

/**
 * Counts up to `value` on mount using the standard Reanimated TextInput trick.
 * Non-interactive — never captures touches (so parent cards stay pressable).
 */
export function AnimatedCount({ value, style, instant = false }: AnimatedCountProps) {
  const progress = useSharedValue(instant ? value : 0);
  const minWidth = useMemo(() => minWidthForDigits(value, style), [value, style]);

  useEffect(() => {
    progress.value = instant ? value : withTiming(value, TIMING_FILL);
  }, [value, instant, progress]);

  const animatedProps = useAnimatedProps(() => {
    return { text: String(Math.round(progress.value)) } as Record<string, string>;
  });

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      caretHidden
      scrollEnabled={false}
      defaultValue={String(Math.round(instant ? value : 0))}
      animatedProps={animatedProps}
      style={[
        {
          includeFontPadding: false,
          textAlign: 'center',
          textAlignVertical: 'center',
          minWidth,
          paddingHorizontal: 0,
        },
        style,
      ]}
    />
  );
}
