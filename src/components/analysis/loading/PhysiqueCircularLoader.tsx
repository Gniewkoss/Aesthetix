import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { C, T, S } from '../../../theme/obsidian';
import { AnalysisPhotoStack } from './AnalysisPhotoStack';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const LOADER_SIZE = 276;
const VIEW = 180;
const CX = 90;
const CY = 90;
const RADIUS = 78;
const STROKE = 8;
const NORMALIZED_RADIUS = RADIUS - STROKE / 2;
const CIRCUMFERENCE = NORMALIZED_RADIUS * 2 * Math.PI;
const GRAD_ID = 'physiqueRingGrad';
const BLOOM_ID = 'physiqueBloom';
const INNER_ID = 'physiqueInner';

interface PhysiqueCircularLoaderProps {
  imageUris?: string[];
  progress: SharedValue<number>;
  percentLabel: number;
  reduceMotion?: boolean;
}

export function PhysiqueCircularLoader({
  imageUris = [],
  progress,
  percentLabel,
  reduceMotion = false,
}: PhysiqueCircularLoaderProps) {
  const hasPhotos = imageUris.length > 0;
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const breathe = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      breathe.value = 1;
      return;
    }
    breathe.value = withRepeat(
      withTiming(1.04, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, breathe]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, scaleStyle]}>
      <Svg width={LOADER_SIZE} height={LOADER_SIZE} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <Defs>
          <RadialGradient id={BLOOM_ID} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={C.volt} stopOpacity={0.14} />
            <Stop offset="45%" stopColor={C.volt} stopOpacity={0.04} />
            <Stop offset="100%" stopColor={C.volt} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={INNER_ID} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={C.surface2} stopOpacity={0.9} />
            <Stop offset="70%" stopColor={C.surface1} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={C.canvas} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={C.volt} />
            <Stop offset="100%" stopColor={C.success} />
          </LinearGradient>
        </Defs>

        {/* Soft halo — no solid fill */}
        <Circle cx={CX} cy={CY} r={NORMALIZED_RADIUS + 14} fill={`url(#${BLOOM_ID})`} />

        {/* Inner disc — dark glass, not olive */}
        <Circle cx={CX} cy={CY} r={NORMALIZED_RADIUS - 6} fill={`url(#${INNER_ID})`} />
        <Circle
          cx={CX}
          cy={CY}
          r={NORMALIZED_RADIUS - 6}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />

        {/* Track */}
        <Circle
          cx={CX}
          cy={CY}
          r={NORMALIZED_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />

        {/* Progress */}
        <AnimatedCircle
          cx={CX}
          cy={CY}
          r={NORMALIZED_RADIUS}
          fill="none"
          stroke={`url(#${GRAD_ID})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ringProps}
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        {hasPhotos && (
          <View
            style={[
              styles.photoWrap,
              imageUris.length === 1 && styles.photoWrapSingle,
            ]}
          >
            <AnalysisPhotoStack
              imageUris={imageUris}
              variant="compact"
              animate={!reduceMotion}
            />
          </View>
        )}
        <View style={[styles.percentRow, hasPhotos && styles.percentRowWithPhotos]}>
          <Text style={[styles.percent, hasPhotos && styles.percentCompact]}>{percentLabel}</Text>
          <Text style={[styles.percentUnit, hasPhotos && styles.percentUnitCompact]}>%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: LOADER_SIZE,
    height: LOADER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.sm,
  },
  photoWrap: {
    marginBottom: 2,
    transform: [{ translateX: 6 }],
  },
  photoWrapSingle: {
    transform: [{ translateX: 0 }],
    alignSelf: 'center',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  percentRowWithPhotos: {
    marginTop: -4,
  },
  percent: {
    fontFamily: T.metric.fontFamily,
    fontSize: 44,
    lineHeight: 48,
    color: C.volt,
    letterSpacing: -1.4,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  percentCompact: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  percentUnit: {
    fontFamily: T.label.fontFamily,
    fontSize: 18,
    lineHeight: 26,
    color: C.volt,
    opacity: 0.8,
    marginLeft: 1,
    marginTop: 6,
    includeFontPadding: false,
  },
  percentUnitCompact: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});
