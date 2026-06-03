import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { C } from '../../../theme/obsidian';

/** Fixed layout so particles do not jump on re-render. */
const PARTICLES = [
  { left: '8%', top: '12%', duration: 3200, delay: 0 },
  { left: '22%', top: '68%', duration: 4100, delay: 400 },
  { left: '41%', top: '24%', duration: 3600, delay: 800 },
  { left: '55%', top: '82%', duration: 4800, delay: 200 },
  { left: '67%', top: '15%', duration: 3900, delay: 1200 },
  { left: '78%', top: '44%', duration: 4400, delay: 600 },
  { left: '88%', top: '71%', duration: 3700, delay: 1000 },
  { left: '14%', top: '38%', duration: 4500, delay: 300 },
  { left: '33%', top: '91%', duration: 3300, delay: 1400 },
  { left: '49%', top: '52%', duration: 4200, delay: 700 },
  { left: '61%', top: '33%', duration: 3800, delay: 1600 },
  { left: '72%', top: '58%', duration: 3500, delay: 900 },
  { left: '5%', top: '77%', duration: 4600, delay: 500 },
  { left: '36%', top: '8%', duration: 4000, delay: 1100 },
  { left: '84%', top: '22%', duration: 3400, delay: 1800 },
  { left: '92%', top: '48%', duration: 4300, delay: 250 },
  { left: '18%', top: '55%', duration: 3700, delay: 1300 },
  { left: '44%', top: '72%', duration: 4100, delay: 950 },
  { left: '58%', top: '6%', duration: 3600, delay: 1700 },
  { left: '26%', top: '19%', duration: 3900, delay: 650 },
] as const;

interface AnalysisParticlesProps {
  animate?: boolean;
}

function Particle({
  left,
  top,
  duration,
  delay,
  animate,
}: (typeof PARTICLES)[number] & { animate: boolean }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    if (!animate) {
      opacity.value = 0.35;
      return;
    }
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.8, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [animate, delay, duration, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: 0.85 + opacity.value * 0.4 }],
  }));

  return (
    <Animated.View
      style={[styles.dot, style, { left: left as `${number}%`, top: top as `${number}%` }]}
      pointerEvents="none"
    />
  );
}

export function AnalysisParticles({ animate = true }: AnalysisParticlesProps) {
  return (
    <View style={styles.layer} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} animate={animate} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.volt,
  },
});
