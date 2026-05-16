import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, FONTS, GRADIENTS, SPACING } from '../../../theme';
import { AnalysisPhotoStack } from './AnalysisPhotoStack';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RING_SIZE = 256;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GRAD_ID = 'analysisRingGrad';

interface AnalysisProgressRingProps {
  imageUris: string[];
  progress: SharedValue<number>;
  percentLabel: number;
}

export function AnalysisProgressRing({
  imageUris,
  progress,
  percentLabel,
}: AnalysisProgressRingProps) {
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const cx = RING_SIZE / 2;
  const [gradStart, gradEnd] = GRADIENTS.primary;

  return (
    <View style={styles.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <LinearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradStart} />
            <Stop offset="100%" stopColor={gradEnd} />
          </LinearGradient>
        </Defs>

        <Circle
          cx={cx}
          cy={cx}
          r={RADIUS}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cx}
          r={RADIUS}
          stroke={`url(#${GRAD_ID})`}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ringProps}
          transform={`rotate(-90, ${cx}, ${cx})`}
        />
      </Svg>

      <View style={styles.inner}>
        <AnalysisPhotoStack imageUris={imageUris} />
        <View style={styles.percentBadge}>
          <Text style={styles.percentValue}>{percentLabel}</Text>
          <Text style={styles.percentUnit}>%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE - 52,
    height: RING_SIZE - 52,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
    gap: 2,
  },
  percentValue: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONTS.sizes['2xl'],
    color: COLORS.text.primary,
    lineHeight: FONTS.sizes['2xl'] * 1.1,
  },
  percentUnit: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONTS.sizes.sm,
    color: COLORS.accent,
    lineHeight: 22,
    paddingBottom: 2,
  },
});
