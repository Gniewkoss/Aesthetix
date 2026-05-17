import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING, getScoreColor } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - SPACING.base * 2 - 32;
const CHART_H = 150;
const PAD = { top: 12, bottom: 24, left: 10, right: 10 };

function LineChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const range = max - min || 1;
  const stepX = (CHART_W - PAD.left - PAD.right) / (data.length - 1);
  const chartH = CHART_H - PAD.top - PAD.bottom;

  const pts = data.map((v, i) => {
    const x = PAD.left + i * stepX;
    const y = PAD.top + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {[0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD.top + (1 - t) * chartH;
        return (
          <Line key={i} x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        );
      })}

      <Polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />

      {data.map((v, i) => {
        const x = PAD.left + i * stepX;
        const y = PAD.top + chartH - ((v - min) / range) * chartH;
        return (
          <Circle key={i} cx={x} cy={y} r={4} fill={COLORS.bg.primary} stroke={color} strokeWidth={1.5} />
        );
      })}
    </Svg>
  );
}

export function ProgressScreen() {
  const { entries } = useProgressStore();

  if (entries.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING['2xl'] }}>
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.emptyIconRing}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="trending-up-outline" size={26} color={COLORS.green} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(220).duration(450)} style={styles.emptyTitle}>
            No data yet
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(320).duration(450)} style={styles.emptyText}>
            Progress charts appear after your first scan.{'\n'}Run at least 2 scans to see trends over time.
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(440).duration(400)} style={styles.emptyMeta}>
            {[
              { icon: 'analytics-outline', label: 'Score over time', color: COLORS.accent },
              { icon: 'body-outline', label: 'Body fat tracking', color: COLORS.amber },
              { icon: 'resize-outline', label: 'V-Taper progress', color: '#8B5CF6' },
            ].map((item) => (
              <View key={item.label} style={styles.emptyMetaRow}>
                <Ionicons name={item.icon as any} size={14} color={item.color} />
                <Text style={[styles.emptyMetaLabel, { color: item.color }]}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  const scores = entries.map((e) => e.overallScore);
  const bodyFats = entries.map((e) => e.bodyFat);
  const vtapers = entries.map((e) => e.vTaperScore);

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const scoreDelta = latest && first ? latest.overallScore - first.overallScore : 0;
  const bfDelta = latest && first ? latest.bodyFat - first.bodyFat : 0;

  const labels = entries.map((e) => {
    const d = new Date(e.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>{entries.length} data points tracked</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary Cards */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderColor: (scoreDelta >= 0 ? COLORS.greenBorder : COLORS.redBorder) }]}>
              <View style={styles.summaryIconRow}>
                <Ionicons
                  name={scoreDelta >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={scoreDelta >= 0 ? COLORS.green : COLORS.red}
                />
                <Text style={styles.summaryLabel}>Score</Text>
              </View>
              <Text style={[styles.summaryDelta, { color: scoreDelta >= 0 ? COLORS.green : COLORS.red }]}>
                {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
              </Text>
            </View>

            <View style={[styles.summaryCard, { borderColor: (bfDelta <= 0 ? COLORS.greenBorder : COLORS.redBorder) }]}>
              <View style={styles.summaryIconRow}>
                <Ionicons
                  name={bfDelta <= 0 ? 'trending-down' : 'trending-up'}
                  size={14}
                  color={bfDelta <= 0 ? COLORS.green : COLORS.red}
                />
                <Text style={styles.summaryLabel}>Body Fat</Text>
              </View>
              <Text style={[styles.summaryDelta, { color: bfDelta <= 0 ? COLORS.green : COLORS.red }]}>
                {bfDelta <= 0 ? '' : '+'}{bfDelta}%
              </Text>
            </View>
          </Animated.View>

          {/* Score Chart */}
          <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Overall Score</Text>
            <LineChart data={scores} color={COLORS.accent} />
            <View style={styles.chartLabels}>
              {labels.map((l, i) => (
                <Text key={i} style={styles.chartLabel}>{l}</Text>
              ))}
            </View>
          </Animated.View>

          {/* Body Fat Chart */}
          <Animated.View entering={FadeInDown.delay(130).duration(350)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Body Fat %</Text>
            <LineChart data={bodyFats} color={COLORS.amber} />
            <View style={styles.chartLabels}>
              {labels.map((l, i) => (
                <Text key={i} style={styles.chartLabel}>{l}</Text>
              ))}
            </View>
          </Animated.View>

          {/* V-Taper Chart */}
          <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>V-Taper Score</Text>
            <LineChart data={vtapers} color={COLORS.purple} />
            <View style={styles.chartLabels}>
              {labels.map((l, i) => (
                <Text key={i} style={styles.chartLabel}>{l}</Text>
              ))}
            </View>
          </Animated.View>

          {/* Data table */}
          <Animated.View entering={FadeInDown.delay(230).duration(350)} style={styles.table}>
            <Text style={styles.chartTitle}>Scan History</Text>
            <View style={styles.tableHeader}>
              {['Date', 'Score', 'BF%', 'V-Taper'].map((h) => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {[...entries].reverse().map((e, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowEven]}>
                <Text style={styles.tableCell}>
                  {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.tableCell, { color: getScoreColor(e.overallScore), fontFamily: FONT_FAMILY.bodyBold }]}>
                  {e.overallScore}
                </Text>
                <Text style={styles.tableCell}>{e.bodyFat}%</Text>
                <Text style={[styles.tableCell, { color: COLORS.purple }]}>{e.vTaperScore}</Text>
              </View>
            ))}
          </Animated.View>

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING['2xl'], marginBottom: SPACING.base },
  title: { fontSize: FONTS.sizes['3xl'], fontFamily: FONT_FAMILY.display, color: COLORS.text.primary, letterSpacing: TRACKING.display },
  subtitle: { fontSize: FONTS.sizes.sm, fontFamily: FONT_FAMILY.body, color: COLORS.text.muted, marginTop: 2 },

  // ── Empty state
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    backgroundColor: COLORS.greenDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING['2xl'],
  },
  emptyIconInner: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    lineHeight: FONTS.sizes.sm * 1.65,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  emptyMeta: {
    gap: SPACING.sm,
    alignItems: 'flex-start',
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  emptyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyMetaLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  scroll: { paddingHorizontal: SPACING.base },

  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.base,
    alignItems: 'center',
    gap: 6,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryDelta: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
  },

  chartCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PAD.left,
    marginTop: 4,
  },
  chartLabel: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

  table: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tableHeaderCell: {
    flex: 1,
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tableRow: { flexDirection: 'row', paddingVertical: SPACING.sm },
  tableRowEven: { backgroundColor: 'rgba(255,255,255,0.015)', borderRadius: RADIUS.sm },
  tableCell: {
    flex: 1,
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
  },
});
