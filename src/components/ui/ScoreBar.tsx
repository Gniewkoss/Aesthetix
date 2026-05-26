import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  showScore?: boolean;
  height?: number;
  delay?: number;
}

export function ScoreBar({ label, score, maxScore = 100, showScore = true, height = 4, delay = 0 }: ScoreBarProps) {
  const width = useSharedValue(0);
  const color = getScoreColor(score);

  useEffect(() => {
    const timeout = setTimeout(() => {
      width.value = withTiming((score / maxScore) * 100, {
        duration: 900,
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
    marginBottom: 6,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
    letterSpacing: 0.1,
  },
  score: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  track: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADIUS.full,
  },
});
