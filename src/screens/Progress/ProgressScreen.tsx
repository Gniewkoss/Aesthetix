import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Polyline, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - SPACING.base * 2 - 32;
const CHART_H = 160;
const PAD = { top: 16, bottom: 28, left: 12, right: 12 };

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
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD.top + (1 - t) * (CHART_H - PAD.top - PAD.bottom);
        const val = Math.round(min + t * range);
        return (
          <React.Fragment key={i}>
            <Line x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <SvgText x={PAD.left - 2} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize={8} textAnchor="end">{val}</SvgText>
          </React.Fragment>
        );
      })}

      {/* Line */}
      <Polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {data.map((v, i) => {
        const x = PAD.left + i * stepX;
        const y = PAD.top + chartH - ((v - min) / range) * chartH;
        return (
          <React.Fragment key={i}>
            <Circle cx={x} cy={y} r={5} fill={COLORS.bg.primary} stroke={color} strokeWidth={2} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export function ProgressScreen() {
  const { entries, loadMockProgress } = useProgressStore();

  useEffect(() => {
    if (entries.length === 0) loadMockProgress();
  }, []);

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
          <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryRow}>
            <LinearGradient
              colors={scoreDelta >= 0 ? ['rgba(6,255,165,0.1)', 'transparent'] : ['rgba(255,0,110,0.1)', 'transparent']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.summaryEmoji}>📈</Text>
              <Text style={[styles.summaryDelta, { color: scoreDelta >= 0 ? COLORS.green : COLORS.pink }]}>
                {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
              </Text>
              <Text style={styles.summaryLabel}>Overall Score</Text>
            </LinearGradient>

            <LinearGradient
              colors={bfDelta <= 0 ? ['rgba(6,255,165,0.1)', 'transparent'] : ['rgba(255,0,110,0.1)', 'transparent']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.summaryEmoji}>🔥</Text>
              <Text style={[styles.summaryDelta, { color: bfDelta <= 0 ? COLORS.green : COLORS.pink }]}>
                {bfDelta <= 0 ? '' : '+'}{bfDelta}%
              </Text>
              <Text style={styles.summaryLabel}>Body Fat</Text>
            </LinearGradient>
          </Animated.View>

          {/* Score Chart */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Overall Score Over Time</Text>
            <LineChart data={scores} color={COLORS.cyan} />
            <View style={styles.chartLabels}>
              {labels.map((l, i) => (
                <Text key={i} style={styles.chartLabel}>{l}</Text>
              ))}
            </View>
          </Animated.View>

          {/* Body Fat Chart */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Body Fat % Over Time</Text>
            <LineChart data={bodyFats} color={COLORS.orange} />
            <View style={styles.chartLabels}>
              {labels.map((l, i) => (
                <Text key={i} style={styles.chartLabel}>{l}</Text>
              ))}
            </View>
          </Animated.View>

          {/* V-Taper Chart */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>V-Taper Score</Text>
            <LineChart data={vtapers} color={COLORS.purple} />
            <View style={styles.chartLabels}>
              {labels.map((l, i) => (
                <Text key={i} style={styles.chartLabel}>{l}</Text>
              ))}
            </View>
          </Animated.View>

          {/* Data table */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.table}>
            <Text style={styles.chartTitle}>Scan History</Text>
            <View style={styles.tableHeader}>
              {['Date', 'Score', 'BF%', 'V-Taper'].map((h) => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {[...entries].reverse().map((e, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowEven]}>
                <Text style={styles.tableCell}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                <Text style={[styles.tableCell, { color: getScoreColor(e.overallScore), fontWeight: FONTS.weights.bold }]}>{e.overallScore}</Text>
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
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 2 },
  scroll: { paddingHorizontal: SPACING.base },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  summaryCard: {
    flex: 1, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: SPACING.base, alignItems: 'center', gap: 4,
  },
  summaryEmoji: { fontSize: 24 },
  summaryDelta: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, fontWeight: FONTS.weights.semibold },
  chartCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  chartTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text.primary, marginBottom: SPACING.sm },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PAD.left, marginTop: 4 },
  chartLabel: { fontSize: 9, color: COLORS.text.muted },
  table: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', paddingBottom: SPACING.sm, marginBottom: SPACING.sm },
  tableHeaderCell: { flex: 1, color: COLORS.text.muted, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: SPACING.sm },
  tableRowEven: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: RADIUS.sm },
  tableCell: { flex: 1, color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, textAlign: 'center' },
});
