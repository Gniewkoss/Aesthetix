import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { C } from '../../../theme/obsidian';
import { useReducedMotion } from '../../../screens/Dashboard/home/useReducedMotion';

type SpotSpec = {
  id: string;
  cx: string;
  cy: string;
  r: string;
  peak: number;
  mid: number;
  phaseMs: number;
};

/** Home-style point blooms — top-right + bottom-left. */
const SPOTS: SpotSpec[] = [
  { id: 'topSpot', cx: '80%', cy: '0%', r: '72%', peak: 0.13, mid: 0.036, phaseMs: 0 },
  { id: 'bottomSpot', cx: '24%', cy: '100%', r: '66%', peak: 0.10, mid: 0.028, phaseMs: 1600 },
];

function StaticSpotSvg({ spot }: { spot: SpotSpec }) {
  return (
    <Svg width="100%" height="100%" pointerEvents="none">
      <Defs>
        <RadialGradient id={spot.id} cx={spot.cx} cy={spot.cy} r={spot.r}>
          <Stop offset="0" stopColor={C.volt} stopOpacity={spot.peak} />
          <Stop offset="0.5" stopColor={C.volt} stopOpacity={spot.mid} />
          <Stop offset="1" stopColor={C.volt} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${spot.id})`} />
    </Svg>
  );
}

function AnimatedSpotLayer({ spot, animate }: { spot: SpotSpec; animate: boolean }) {
  const breathe = useSharedValue(animate ? 0.72 : 1);

  useEffect(() => {
    if (!animate) {
      breathe.value = 1;
      return;
    }
    breathe.value = 0.72;
    breathe.value = withDelay(
      spot.phaseMs,
      withRepeat(
        withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [animate, spot.phaseMs, breathe]);

  const layerStyle = useAnimatedStyle(() => ({
    opacity: breathe.value,
  }));

  return (
    <Animated.View style={[styles.layer, layerStyle]} pointerEvents="none">
      <StaticSpotSvg spot={spot} />
    </Animated.View>
  );
}

/**
 * Point radial blooms (Home-style) with a slow luminosity pulse.
 * Opacity is animated on full-screen layers — no SVG Defs animation.
 */
export function AnalysisHeaderGlow() {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View style={styles.full} pointerEvents="none">
      {SPOTS.map((spot) => (
        <AnimatedSpotLayer key={spot.id} spot={spot} animate={!reduceMotion} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  full: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
