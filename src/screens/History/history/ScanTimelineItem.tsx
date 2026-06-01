import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhysiqueAnalysis } from '../../../types';
import { C, T, R, S, LAYOUT, scoreColor, scoreTier } from '../../../theme/obsidian';
import { VoltRing } from '../../Dashboard/home/VoltRing';
import { PressableScale } from '../../Dashboard/home/PressableScale';

interface ScanTimelineItemProps {
  analysis: PhysiqueAnalysis;
  /** Delta vs the previous (older) scan, or null for the first scan. */
  diff: number | null;
  onPress: () => void;
}

export function ScanTimelineItem({ analysis, diff, onPress }: ScanTimelineItemProps) {
  const col = scoreColor(analysis.overallScore);
  const tier = scoreTier(analysis.overallScore);
  const d = new Date(analysis.createdAt);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const hasDelta = diff !== null && diff !== 0;
  const deltaColor = (diff ?? 0) > 0 ? C.success : C.danger;

  return (
    <PressableScale
      scaleTo={0.985}
      onPress={onPress}
      accessibilityLabel={`Scan from ${dateLabel}, score ${analysis.overallScore}, ${tier}`}
      style={[styles.card, { borderColor: col + '24' }]}
    >
      {/* Tier accent bar */}
      <View style={[styles.accent, { backgroundColor: col }]} />

      {/* Score ring */}
      <VoltRing score={analysis.overallScore} size={54} strokeWidth={5} color={col} instant>
        <Text style={[T.metricSm, { color: col, fontSize: 18 }]}>{analysis.overallScore}</Text>
      </VoltRing>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[T.label, { color: C.text }]}>{dateLabel}</Text>
        <Text style={[T.caption, { color: C.text3 }]}>{timeLabel}</Text>
        <View style={styles.chips}>
          <Chip label={`BF ${analysis.bodyFat}%`} />
          <Chip label={`Sym ${analysis.symmetryScore}`} />
        </View>
      </View>

      {/* Right */}
      <View style={styles.right}>
        {hasDelta && (
          <View style={[styles.deltaBadge, { backgroundColor: deltaColor + '1A', borderColor: deltaColor + '38' }]}>
            <Ionicons name={diff! > 0 ? 'arrow-up' : 'arrow-down'} size={10} color={deltaColor} />
            <Text style={[T.overline, { color: deltaColor }]}>{Math.abs(diff!)}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={C.text3} />
      </View>
    </PressableScale>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={[T.caption, { color: C.text2 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.surface1,
    borderRadius: R.lg,
    borderWidth: 1,
    paddingVertical: LAYOUT.tilePad,
    paddingLeft: LAYOUT.tilePad + 6, // clear the accent bar
    paddingRight: LAYOUT.tilePad,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  info: { flex: 1, minWidth: 0, gap: 3 },
  chips: { flexDirection: 'row', gap: S.xs, marginTop: 4 },
  chip: {
    backgroundColor: C.surface2,
    borderRadius: R.xs,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
  },
  right: { alignItems: 'flex-end', gap: S.sm, flexShrink: 0 },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: R.pill,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
});
