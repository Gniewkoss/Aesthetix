import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../../theme/obsidian';

/** Three Volt dots pulsing in sequence. Static under reduced motion. */
export function TypingDots({ reduceMotion }: { reduceMotion: boolean }) {
  const d1 = useSharedValue(reduceMotion ? 1 : 0);
  const d2 = useSharedValue(reduceMotion ? 1 : 0);
  const d3 = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const cfg = { duration: 500, easing: Easing.inOut(Easing.ease) };
    d1.value = withRepeat(withTiming(1, cfg), -1, true);
    const t2 = setTimeout(() => { d2.value = withRepeat(withTiming(1, cfg), -1, true); }, 160);
    const t3 = setTimeout(() => { d3.value = withRepeat(withTiming(1, cfg), -1, true); }, 320);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, [reduceMotion]);

  const s1 = useAnimatedStyle(() => ({ opacity: 0.3 + d1.value * 0.7 }));
  const s2 = useAnimatedStyle(() => ({ opacity: 0.3 + d2.value * 0.7 }));
  const s3 = useAnimatedStyle(() => ({ opacity: 0.3 + d3.value * 0.7 }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, s1]} />
      <Animated.View style={[styles.dot, s2]} />
      <Animated.View style={[styles.dot, s3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 2, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.volt },
});
