import React, { useEffect } from 'react';
import { TextInput, TextStyle, StyleProp } from 'react-native';
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

/**
 * Counts up to `value` on mount using the standard Reanimated TextInput trick.
 * Non-interactive — never captures touches (so parent cards stay pressable).
 */
export function AnimatedCount({ value, style, instant = false }: AnimatedCountProps) {
  const progress = useSharedValue(instant ? value : 0);

  useEffect(() => {
    progress.value = instant ? value : withTiming(value, TIMING_FILL);
  }, [value, instant]);

  const animatedProps = useAnimatedProps(() => {
    return { text: String(Math.round(progress.value)) } as any;
  });

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      caretHidden
      defaultValue={String(instant ? value : 0)}
      animatedProps={animatedProps}
      style={[
        {
          includeFontPadding: false,
          textAlign: 'center',
          textAlignVertical: 'center',
        },
        style,
      ]}
    />
  );
}
