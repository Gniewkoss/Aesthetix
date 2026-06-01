import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { AnimatedCount } from '../../Dashboard/home/AnimatedCount';
import { Sparkline } from './Sparkline';

interface TrendSummaryProps {
  /** Scores oldest → newest. */
  scores: number[];
  reduceMotion: boolean;
}

/**
 * Progress hero: total delta from first → latest scan, with a trend sparkline.
 * Degrades to a "baseline" state when there's only one scan.
 */
export function TrendSummary({ scores, reduceMotion }: TrendSummaryProps) {
  const first = scores[0];
  const latest = scores[scores.length - 1];
  const hasTrend = scores.length >= 2;

  // ── Single scan: baseline state ──
  if (!hasTrend) {
    return (
      <View style={[styles.card, { borderColor: C.border }]}>
        <View style={styles.left}>
          <Text style={styles.eyebrow}>BASELINE SET</Text>
          <View style={styles.deltaRow}>
            <AnimatedCount value={latest} instant={reduceMotion} style={[T.metric, { color: C.text }]} />
            <Text style={[T.caption, { color: C.text3 }]}>pts</Text>
          </View>
          <Text style={[T.bodySm, { color: C.text2 }]}>Scan again to track your trajectory</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: C.voltDim }]}>
          <Ionicons name="flag-outline" size={20} color={C.volt} />
        </View>
      </View>
    );
  }

  const delta = latest - first;
  const positive = delta >= 0;
  const trendColor = positive ? C.success : C.danger;

  return (
    <View style={[styles.card, { borderColor: trendColor + '2E' }]}>
      <LinearGradient
        colors={[trendColor + '12', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.left}>
        <Text style={styles.eyebrow}>TOTAL PROGRESS</Text>
        <View style={styles.deltaRow}>
          <Text style={[T.metric, { color: trendColor }]}>{positive ? '+' : '−'}</Text>
          <AnimatedCount value={Math.abs(delta)} instant={reduceMotion} style={[T.metric, { color: trendColor }]} />
          <Text style={[T.caption, { color: C.text3, marginLeft: 2 }]}>pts</Text>
        </View>
        <View style={styles.rangeRow}>
          <Text style={[T.bodySm, { color: C.text3 }]}>{first}</Text>
          <Ionicons name="arrow-forward" size={12} color={C.text3} />
          <Text style={[T.bodySm, { color: C.text }]}>{latest}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.trendChip, { backgroundColor: trendColor + '1A', borderColor: trendColor + '40' }]}>
          <Ionicons name={positive ? 'trending-up' : 'trending-down'} size={13} color={trendColor} />
        </View>
        <Sparkline data={scores} color={trendColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...E.raised,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.base,
    overflow: 'hidden',
  },
  left: { flex: 1, minWidth: 0, gap: S.sm },
  eyebrow: { ...T.overline, color: C.text3 },
  deltaRow: { flexDirection: 'row', alignItems: 'baseline' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  right: { alignItems: 'flex-end', gap: S.sm },
  trendChip: {
    width: 30,
    height: 30,
    borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: R.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
