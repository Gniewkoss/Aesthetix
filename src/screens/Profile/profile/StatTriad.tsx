import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, LAYOUT, E } from '../../../theme/obsidian';
import { AnimatedCount } from '../../Dashboard/home/AnimatedCount';

interface StatTriadProps {
  streak: number;
  scans: number;
  scoreGain: number;
  reduceMotion: boolean;
}

export function StatTriad({ streak, scans, scoreGain, reduceMotion }: StatTriadProps) {
  const gainColor = scoreGain >= 0 ? C.success : C.danger;

  return (
    <View style={styles.card}>
      <Stat icon="flame" color={C.warning}
        value={<AnimatedCount value={streak} instant={reduceMotion} style={[T.metricSm, { color: C.warning }]} />}
        label="Day streak" />
      <View style={styles.divider} />
      <Stat icon="scan-outline" color={C.volt}
        value={<AnimatedCount value={scans} instant={reduceMotion} style={[T.metricSm, { color: C.volt }]} />}
        label="Scans" />
      <View style={styles.divider} />
      <Stat icon="trending-up" color={gainColor}
        value={(
          <View style={styles.gainRow}>
            <Text style={[T.metricSm, { color: gainColor }]}>{scoreGain >= 0 ? '+' : '−'}</Text>
            <AnimatedCount value={Math.abs(scoreGain)} instant={reduceMotion} style={[T.metricSm, { color: gainColor }]} />
          </View>
        )}
        label="Score gain" />
    </View>
  );
}

function Stat({ icon, color, value, label }: { icon: string; color: string; value: React.ReactNode; label: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.iconWrap, { backgroundColor: color + '1A', borderColor: color + '38' }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      {value}
      <Text style={[T.caption, { color: C.text3 }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...E.raised,
    borderRadius: R.xl,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: LAYOUT.cardPad,
  },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gainRow: { flexDirection: 'row', alignItems: 'baseline' },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: C.border, marginVertical: 4 },
});
