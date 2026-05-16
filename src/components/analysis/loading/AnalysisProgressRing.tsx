import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, FONTS } from '../../../theme';
import { AnalysisPhotoStack } from './AnalysisPhotoStack';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RING_SIZE = 292;
const STROKE = 5;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SCANNER_STROKE = 2;
const SCANNER_RADIUS = RADIUS + 10;

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
  const rotation = useSharedValue(0);
  const glowPulse = useSharedValue(0.6);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [rotation, glowPulse]);

  const scannerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glowPulse.value * 0.2,
    transform: [{ scale: 0.96 + glowPulse.value * 0.06 }],
  }));

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const cx = RING_SIZE / 2;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.glowHalo, glowStyle]} />

      <Animated.View style={[styles.scannerLayer, scannerStyle]}>
        <Svg width={RING_SIZE + 24} height={RING_SIZE + 24} style={styles.scannerSvg}>
          <Circle
            cx={(RING_SIZE + 24) / 2}
            cy={(RING_SIZE + 24) / 2}
            r={SCANNER_RADIUS}
            stroke="rgba(59,130,246,0.18)"
            strokeWidth={SCANNER_STROKE}
            strokeDasharray="8 14"
            fill="none"
          />
        </Svg>
      </Animated.View>

      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1D4ED8" />
            <Stop offset="50%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#7C3AED" />
          </SvgGradient>
          <SvgGradient id="ringGlow" x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <Stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </SvgGradient>
        </Defs>

        <Circle
          cx={cx}
          cy={cx}
          r={RADIUS}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={STROKE + 6}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cx}
          r={RADIUS}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cx}
          r={RADIUS}
          stroke="url(#ringGrad)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ringProps}
          transform={`rotate(-90, ${cx}, ${cx})`}
        />
        <AnimatedCircle
          cx={cx}
          cy={cx}
          r={RADIUS}
          stroke="url(#ringGlow)"
          strokeWidth={STROKE + 4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ringProps}
          transform={`rotate(-90, ${cx}, ${cx})`}
          opacity={0.45}
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
  glowHalo: {
    position: 'absolute',
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    backgroundColor: 'rgba(59,130,246,0.12)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
  },
  scannerLayer: {
    position: 'absolute',
    width: RING_SIZE + 24,
    height: RING_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerSvg: {
    position: 'absolute',
  },
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE - 48,
    height: RING_SIZE - 48,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
    gap: 1,
  },
  percentValue: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 28,
    color: COLORS.text.primary,
    lineHeight: 30,
  },
  percentUnit: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONTS.sizes.sm,
    color: COLORS.accent,
    lineHeight: 22,
    paddingBottom: 2,
  },
});
