import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, getScoreColor, getScoreLabel } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  showScore?: boolean;
  subtitle?: string;
  animated?: boolean;
  color?: string;
}

export function CircularProgress({
  score,
  size = 200,
  strokeWidth = 12,
  showLabel = true,
  showScore = true,
  subtitle,
  animated = true,
  color,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(score / 100, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = score / 100;
    }
  }, [score, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const scoreColor = color ?? getScoreColor(score);
  const gradientId = `gradient_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={scoreColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={scoreColor + '88'} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        {showScore && (
          <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
        )}
        {showLabel && (
          <Text style={[styles.label, { color: scoreColor }]}>{getScoreLabel(score)}</Text>
        )}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: FONTS.sizes['4xl'],
    fontWeight: FONTS.weights.black,
    lineHeight: FONTS.sizes['4xl'] * 1.1,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 2,
    marginTop: 2,
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    marginTop: 4,
  },
});
