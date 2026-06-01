import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { TIMING_FILL } from '../../../motion';
import { AnimatedCount } from '../../Dashboard/home/AnimatedCount';

interface XpCardProps {
  xp: number;
  xpInLevel: number;
  xpPerLevel: number;
  level: number;
  reduceMotion: boolean;
}

export function XpCard({ xp, xpInLevel, xpPerLevel, level, reduceMotion }: XpCardProps) {
  const progress = Math.max(0, Math.min(1, xpInLevel / xpPerLevel));
  const fill = useSharedValue(0);
  const fillStyle = useAnimatedStyle(() => ({ width: fill.value }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const target = e.nativeEvent.layout.width * progress;
    fill.value = reduceMotion ? target : withTiming(target, TIMING_FILL);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flash" size={14} color={C.volt} />
          <Text style={[T.label, { color: C.text }]}>XP Progress</Text>
        </View>
        <View style={styles.xpValue}>
          <AnimatedCount value={xp} instant={reduceMotion} style={[T.metricSm, { color: C.volt }]} />
          <Text style={[T.caption, { color: C.text3, marginLeft: 3 }]}>XP</Text>
        </View>
      </View>

      <View style={styles.track} onLayout={onTrackLayout}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>

      <Text style={[T.caption, { color: C.text3, marginTop: S.sm }]}>
        {xpInLevel} / {xpPerLevel} XP to Level {level + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...E.raised,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpValue: { flexDirection: 'row', alignItems: 'baseline' },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: C.volt, borderRadius: R.pill, minWidth: 6 },
});
