import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const EMBERS = [
  { dx: -14, dy: -34, delay: 0, size: 5 },
  { dx: 6, dy: -38, delay: 30, size: 4 },
  { dx: 16, dy: -30, delay: 60, size: 3 },
  { dx: -6, dy: -42, delay: 20, size: 4 },
  { dx: 12, dy: -36, delay: 45, size: 3 },
  { dx: -18, dy: -28, delay: 75, size: 3 },
] as const;

function Ember({
  dx,
  dy,
  delay,
  size,
  color,
  active,
}: (typeof EMBERS)[number] & { color: string; active: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [active, delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: dx * t.value },
      { translateY: dy * t.value },
      { scale: 1 - t.value * 0.65 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.ember,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
      ]}
    />
  );
}

type Props = {
  color: string;
  burstId: number;
};

export function StreakEmberBurst({ color, burstId }: Props) {
  if (burstId <= 0) return null;

  return (
    <View style={styles.host} pointerEvents="none">
      {EMBERS.map((e, i) => (
        <Ember key={`${burstId}-${i}`} {...e} color={color} active />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 8,
    top: '50%',
    width: 16,
    height: 16,
    marginTop: -8,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  ember: {
    position: 'absolute',
  },
});
