import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  showScore?: boolean;
  height?: number;
  delay?: number;
}

export function ScoreBar({ label, score, maxScore = 100, showScore = true, height = 6, delay = 0 }: ScoreBarProps) {
  const width = useSharedValue(0);
  const color = getScoreColor(score);

  useEffect(() => {
    const timeout = setTimeout(() => {
      width.value = withTiming((score / maxScore) * 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [score, delay]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showScore && <Text style={[styles.score, { color }]}>{score}</Text>}
      </View>
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, barStyle, { backgroundColor: color, height }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.medium,
  },
  score: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADIUS.full,
  },
});
