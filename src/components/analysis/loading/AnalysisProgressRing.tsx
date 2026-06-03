import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import { C, T, S } from '../../../theme/obsidian';
import { AnalysisPhotoStack } from './AnalysisPhotoStack';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RING_SIZE = 268;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GRAD_ID = 'analysisRingGrad';

interface AnalysisProgressRingProps {
  imageUris: string[];
  progress: SharedValue<number>;
  percentLabel: number;
}

export function AnalysisProgressRing({ imageUris, progress, percentLabel }: AnalysisProgressRingProps) {
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const cx = RING_SIZE / 2;

  return (
    <View style={styles.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <LinearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={C.volt} />
            <Stop offset="100%" stopColor="#86C500" />
          </LinearGradient>
          {/* Very subtle inner fill — avoid a second centre blob on screen */}
          <RadialGradient id="voltBloom" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={C.volt} stopOpacity={0.05} />
            <Stop offset="0.6" stopColor={C.volt} stopOpacity={0.015} />
            <Stop offset="1" stopColor={C.volt} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Bloom */}
        <Circle cx={cx} cy={cx} r={RADIUS} fill="url(#voltBloom)" />
        {/* Track */}
        <Circle cx={cx} cy={cx} r={RADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE} fill="none" />
        {/* Progress */}
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
  wrapper: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  inner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    marginTop: S.sm,
    gap: 2,
  },
  percentValue: {
    ...T.heroNum,
    fontSize: 32,
    lineHeight: 34,
    color: C.text,
    textAlign: 'center',
    includeFontPadding: false,
  },
  percentUnit: { ...T.cardTitle, fontSize: 15, color: C.volt, lineHeight: 24, paddingBottom: 2 },
});
