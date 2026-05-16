import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../../../theme';

const { width, height } = Dimensions.get('window');

const PARTICLE_COUNT = 18;

function AmbientOrb({
  color,
  size,
  top,
  left,
  delay,
}: {
  color: string;
  size: number;
  top: number;
  left: number;
  delay: number;
}) {
  const pulse = useSharedValue(0.85);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.75, { duration: 2800 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [delay, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.25,
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2, top, left, backgroundColor: color },
        style,
      ]}
    />
  );
}

function Particle({ index }: { index: number }) {
  const drift = useSharedValue(0);

  const seed = useMemo(() => {
    const x = (index * 47 + 13) % width;
    const y = (index * 83 + 40) % (height * 0.85);
    const size = 2 + (index % 3);
    const opacity = 0.12 + (index % 5) * 0.04;
    return { x, y, size, opacity };
  }, [index]);

  React.useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200 + index * 120, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200 + index * 120, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [index, drift]);

  const style = useAnimatedStyle(() => ({
    opacity: seed.opacity + drift.value * 0.12,
    transform: [
      { translateY: (drift.value - 0.5) * 14 },
      { translateX: (drift.value - 0.5) * 6 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: seed.x,
          top: seed.y,
          width: seed.size,
          height: seed.size,
          borderRadius: seed.size,
        },
        style,
      ]}
    />
  );
}

export function AnalysisLoadingBackground() {
  const particles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    [],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#030308', '#080810', '#0A0A12', '#080808']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <AmbientOrb color="rgba(59,130,246,0.22)" size={width * 0.9} top={-height * 0.12} left={-width * 0.25} delay={0} />
      <AmbientOrb color="rgba(124,58,237,0.16)" size={width * 0.75} top={height * 0.45} left={width * 0.35} delay={400} />
      <AmbientOrb color="rgba(29,78,216,0.12)" size={width * 0.55} top={height * 0.08} left={width * 0.55} delay={800} />

      <View style={styles.vignetteTop} />
      <View style={styles.vignetteBottom} />

      {particles.map((i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
  },
  vignetteTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 80 },
    shadowOpacity: 0.9,
    shadowRadius: 120,
  },
  vignetteBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.35,
    backgroundColor: 'transparent',
  },
});
