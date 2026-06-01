import React, { useEffect } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { C, T, R, S } from '../../../theme/obsidian';
import { scoreColor } from '../../../theme/obsidian';
import { TIMING_FILL } from '../../../motion';
import { AnimatedCount } from '../../Dashboard/home/AnimatedCount';

interface ScoreBarRowProps {
  label: string;
  score: number;
  delay?: number;
  reduceMotion: boolean;
}

export function ScoreBarRow({ label, score, delay = 0, reduceMotion }: ScoreBarRowProps) {
  const col = scoreColor(score);
  const trackW = useSharedValue(0);
  const fill = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => { trackW.value = e.nativeEvent.layout.width; };

  useEffect(() => {
    const target = score / 100;
    fill.value = reduceMotion ? target : withDelay(delay, withTiming(target, TIMING_FILL));
  }, [score, reduceMotion, delay]);

  const fillStyle = useAnimatedStyle(() => ({ width: trackW.value * fill.value }));

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={[T.bodySm, { color: C.text2 }]}>{label}</Text>
        <AnimatedCount value={score} instant={reduceMotion} style={[T.label, { color: col }]} />
      </View>
      <View style={styles.track} onLayout={onLayout}>
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: col }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: S.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  track: { height: 5, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: R.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: R.pill },
});
