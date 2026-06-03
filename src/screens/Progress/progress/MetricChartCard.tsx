import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { AnimatedCount } from '../../Dashboard/home/AnimatedCount';
import { LineChartAnimated } from './LineChartAnimated';

interface MetricChartCardProps {
  label: string;
  unit: string;
  data: number[];        // chronological (oldest → newest)
  labels: string[];      // x-axis date labels, same order
  color: string;
  higherIsBetter: boolean;
  reduceMotion: boolean;
  chartWidth: number;
}

/** Show at most `maxLabels` x-axis labels to avoid crowding. */
function sparseLabels(labels: string[], maxLabels = 4): string[] {
  if (labels.length <= maxLabels) return labels;
  const keep = new Set<number>([0, labels.length - 1]);
  const inner = maxLabels - 2;
  for (let j = 1; j <= inner; j++) keep.add(Math.round((j * (labels.length - 1)) / (inner + 1)));
  return labels.map((l, i) => (keep.has(i) ? l : ''));
}

export function MetricChartCard({
  label, unit, data, labels, color, higherIsBetter, reduceMotion, chartWidth,
}: MetricChartCardProps) {
  const latest = data[data.length - 1];
  const first = data[0];
  const best = higherIsBetter ? Math.max(...data) : Math.min(...data);
  const hasTrend = data.length >= 2;

  const delta = hasTrend ? latest - first : 0;
  const improving = higherIsBetter ? delta > 0 : delta < 0;
  const trendColor = delta === 0 ? C.text3 : improving ? C.success : C.danger;

  return (
    <View style={styles.card}>
      {/* Header: current value + trend */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{label.toUpperCase()}</Text>
          <View style={styles.valueRow}>
            <AnimatedCount value={Math.round(latest)} instant={reduceMotion} style={[styles.value, { color }]} />
            {unit ? <Text style={[T.caption, { color: C.text3, marginLeft: 2 }]}>{unit}</Text> : null}
          </View>
        </View>

        {hasTrend && delta !== 0 && (
          <View style={[styles.trendBadge, { backgroundColor: trendColor + '1A', borderColor: trendColor + '38' }]}>
            <Ionicons name={improving ? 'trending-up' : 'trending-down'} size={13} color={trendColor} />
            <Text style={[T.label, { color: trendColor }]}>
              {delta > 0 ? '+' : '−'}{Math.abs(delta)}{unit}
            </Text>
          </View>
        )}
      </View>

      {/* Chart or single-scan hint */}
      {hasTrend ? (
        <>
          <LineChartAnimated data={data} color={color} width={chartWidth} reduceMotion={reduceMotion} labels={labels} unit={unit} />
          <View style={styles.axis}>
            {sparseLabels(labels).map((l, i) => (
              <Text key={i} style={[T.caption, styles.axisLabel]} numberOfLines={1}>{l}</Text>
            ))}
          </View>
          <View style={styles.footer}>
            <Stat label="First" value={`${Math.round(first)}${unit}`} />
            <View style={styles.footDivider} />
            <Stat label="Latest" value={`${Math.round(latest)}${unit}`} highlight={color} />
            <View style={styles.footDivider} />
            <Stat label="Best" value={`${Math.round(best)}${unit}`} />
          </View>
        </>
      ) : (
        <View style={styles.hint}>
          <Ionicons name="analytics-outline" size={16} color={C.text3} />
          <Text style={[T.bodySm, { color: C.text3 }]}>One more scan to chart your {label.toLowerCase()} trend</Text>
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[T.metricSm, { color: highlight ?? C.text }]}>{value}</Text>
      <Text style={[T.caption, { color: C.text3 }]}>{label}</Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: S.sm,
  },
  eyebrow: { ...T.overline, color: C.text3, marginBottom: S.xs },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { ...T.heroNum, fontSize: 38, lineHeight: 42 },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: R.pill,
    borderWidth: 1,
    paddingHorizontal: S.sm,
    paddingVertical: 5,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  axisLabel: { flex: 1, color: C.text3, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: LAYOUT.cardPad,
    paddingTop: S.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  footDivider: { width: 1, height: 26, backgroundColor: C.border },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingVertical: S.xl,
    justifyContent: 'center',
  },
});
