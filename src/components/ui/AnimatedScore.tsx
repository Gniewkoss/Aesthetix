import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, getScoreColor } from '../../theme';

interface AnimatedScoreProps {
  score: number;
  fontSize?: number;
  delay?: number;
  color?: string;
}

export function AnimatedScore({ score, fontSize = FONTS.sizes['5xl'], delay = 0, color }: AnimatedScoreProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const scoreColor = color ?? getScoreColor(score);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 100 }));
  }, [score, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.text, { fontSize, color: scoreColor }, style]}>
      {score}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: FONTS.weights.black,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
