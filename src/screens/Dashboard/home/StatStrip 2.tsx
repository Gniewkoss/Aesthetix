import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { TIMING_FILL } from '../../../motion';
import { AnimatedCount } from './AnimatedCount';

interface StatStripProps {
  streak: number;
  rank: string;
  rankColor: string;
  rankIcon: string;
  xp: number;
  level: number;
  xpInLevel: number;
  xpPerLevel: number;
  reduceMotion: boolean;
}

export function StatStrip({
  streak, rank, rankColor, rankIcon, xp, level, xpInLevel, xpPerLevel, reduceMotion,
}: StatStripProps) {
  const xpProgress = Math.max(0, Math.min(1, xpInLevel / xpPerLevel));
  const fill = useSharedValue(0);
  const fillStyle = useAnimatedStyle(() => ({ width: fill.value }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const target = e.nativeEvent.layout.width * xpProgress;
    fill.value = reduceMotion ? target : withTiming(target, TIMING_FILL);
  };

  return (
    <View style={styles.card}>
      <View style={styles.statsRow}>
        <Stat
          icon="flame"
          color={C.warning}
          value={<AnimatedCount value={streak} instant={reduceMotion} style={[T.metricSm, { color: C.warning }]} />}
          label="Day streak"
        />
        <View style={styles.divider} />
        <Stat
          icon={rankIcon}
          color={rankColor}
          value={<Text style={[T.metricSm, { color: rankColor }]} numberOfLines={1}>{rank}</Text>}
          label="Rank"
        />
        <View style={styles.divider} />
        <Stat
          icon="flash"
          color={C.volt}
          value={<AnimatedCount value={xp} instant={reduceMotion} style={[T.metricSm, { color: C.volt }]} />}
          label="Total XP"
        />
      </View>

      {/* XP progress */}
      <View style={styles.xpBlock}>
        <View style={styles.xpLabels}>
          <Text style={[T.label, { color: C.text }]}>
            Level {level}
            <Text style={{ color: C.text3 }}>  ·  {rank}</Text>
          </Text>
          <Text style={[T.caption, { color: C.text3 }]}>{xpInLevel} / {xpPerLevel} XP</Text>
        </View>
        <View style={styles.track} onLayout={onTrackLayout}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      </View>
    </View>
  );
}

function Stat({ icon, color, value, label }: {
  icon: string;
  color: string;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        <Ionicons name={icon as any} size={13} color={color} />
        {value}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...E.raised,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    gap: LAYOUT.cardPad,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { ...T.caption, color: C.text3 },
  divider: { width: 1, height: 30, backgroundColor: C.border },

  xpBlock: { gap: S.sm },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: C.volt,
    borderRadius: R.pill,
    minWidth: 4,
  },
});
