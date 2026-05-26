import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Polyline, Circle, Line, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '../../store/useProgressStore';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionLabel } from '../../components/common/SectionLabel';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - LAYOUT.pagePad * 2 - SPACING.base * 2;
const CHART_H = 160;
const PAD = { top: 14, bottom: 28, left: 12, right: 12 };

let _gradientId = 0;

function LineChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const gradientId = React.useRef(`grad_${++_gradientId}`).current;
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const range = max - min || 1;
  const stepX = (CHART_W - PAD.left - PAD.right) / (data.length - 1);
  const chartH = CHART_H - PAD.top - PAD.bottom;

  const points = data.map((v, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + chartH - ((v - min) / range) * chartH,
  }));

  const linePts = points.map((p) => `${p.x},${p.y}`).join(' ');
  const bottomY = PAD.top + chartH;
  const areaPath =
    `M ${points[0].x},${bottomY} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${bottomY} Z`;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <SvgGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>

      {[0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD.top + (1 - t) * chartH;
        return (
          <Line key={i} x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
            stroke={COLORS.border.hairline} strokeWidth={1} />
        );
      })}

      <Path d={areaPath} fill={`url(#${gradientId})`} />

      <Polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4.5} fill={COLORS.bg.primary} stroke={color} strokeWidth={2} />
      ))}
    </Svg>
  );
}

/** Show at most `maxLabels` x-axis labels to avoid crowding on narrow screens */
function sparseChartLabels(labels: string[], maxLabels = 4): { label: string; key: number }[] {
  if (labels.length <= maxLabels) {
    return labels.map((label, i) => ({ label, key: i }));
  }
  const indices = new Set<number>([0, labels.length - 1]);
  const innerSlots = maxLabels - 2;
  for (let j = 1; j <= innerSlots; j++) {
    indices.add(Math.round((j * (labels.length - 1)) / (innerSlots + 1)));
  }
  return labels.map((label, i) => ({
    label: indices.has(i) ? label : '',
    key: i,
  }));
}

function trendLabel(data: number[], higherIsBetter: boolean): { text: string; variant: 'success' | 'destructive' | 'secondary'; icon: string } {
  if (data.length < 2) return { text: '', variant: 'secondary', icon: 'remove' };
  const delta = data[data.length - 1] - data[0];
  const improving = higherIsBetter ? delta > 0 : delta < 0;
  const neutral = delta === 0;
  if (neutral) return { text: 'No change', variant: 'secondary', icon: 'remove' };
  return improving
    ? { text: `+${Math.abs(delta).toFixed(1)} overall`, variant: 'success', icon: 'trending-up' }
    : { text: `-${Math.abs(delta).toFixed(1)} overall`, variant: 'destructive', icon: 'trending-down' };
}

export function ProgressScreen() {
  const { entries } = useProgressStore();

  // All hooks must run before any conditional return
  const scores   = useMemo(() => entries.map((e) => e.overallScore), [entries]);
  const bodyFats = useMemo(() => entries.map((e) => e.bodyFat), [entries]);
  const vtapers  = useMemo(() => entries.map((e) => e.vTaperScore), [entries]);
  const labels   = useMemo(() => entries.map((e) => {
    const d = new Date(e.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }), [entries]);

  if (entries.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageHeader variant="tab" title="Progress" />
          <EmptyState
            iconName="trending-up-outline"
            iconColor={COLORS.green}
            title="No data yet"
            subtitle={`Progress charts appear after your first scan.\nRun at least 2 scans to see trends over time.`}
          >
            <View style={styles.emptyMetaCard}>
              {[
                { icon: 'analytics-outline', label: 'Score over time',   color: COLORS.accent },
                { icon: 'body-outline',      label: 'Body fat tracking', color: COLORS.amber  },
                { icon: 'resize-outline',    label: 'V-Taper progress',  color: COLORS.indigo },
              ].map((item) => (
                <View key={item.label} style={styles.emptyMetaRow}>
                  <View style={styles.emptyMetaIcon}>
                    <Ionicons name={item.icon as any} size={13} color={item.color} />
                  </View>
                  <Text style={[styles.emptyMetaLabel, { color: item.color }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </EmptyState>
        </SafeAreaView>
      </View>
    );
  }

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const scoreDelta = latest && first ? latest.overallScore - first.overallScore : 0;
  const bfDelta = latest && first ? latest.bodyFat - first.bodyFat : 0;

  const scoreTrend = trendLabel(scores, true);
  const bfTrend = trendLabel(bodyFats, false);
  const vtaperTrend = trendLabel(vtapers, true);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageHeader
          variant="tab"
          title="Progress"
          subtitle={`${entries.length} scan${entries.length !== 1 ? 's' : ''} tracked`}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Delta summary ────────────────────────────── */}
          {entries.length >= 2 && (
            <Animated.View entering={FadeInDown.duration(350)} style={styles.summaryRow}>
              {[
                { label: 'Score', delta: scoreDelta, suffix: '', higherBetter: true },
                { label: 'Body Fat', delta: bfDelta, suffix: '%', higherBetter: false },
              ].map(({ label, delta, suffix, higherBetter }) => {
                const positive = higherBetter ? delta >= 0 : delta <= 0;
                const color = positive ? COLORS.green : COLORS.red;
                const iconName = positive ? 'trending-up' : 'trending-down';
                return (
                  <GlassCard key={label} style={[
                    styles.summaryCard,
                    { borderColor: positive ? COLORS.greenBorder : COLORS.redBorder },
                  ]}>
                    <View style={styles.summaryTop}>
                      <Ionicons name={iconName as any} size={13} color={color} />
                      <Text style={styles.summaryLabel}>{label}</Text>
                    </View>
                    <Text style={[styles.summaryDelta, { color }]}>
                      {delta >= 0 && higherBetter ? '+' : ''}{delta}{suffix}
                    </Text>
                  </GlassCard>
                );
              })}
            </Animated.View>
          )}

          <SectionLabel label="Overall Score" noTopMargin={entries.length < 2} />

          {/* ── Score chart ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Overall Score</Text>
              {scoreTrend.text ? (
                <Badge variant={scoreTrend.variant} size="sm"
                  leadingDot={false}
                >
                  {scoreTrend.text}
                </Badge>
              ) : null}
            </View>
            <LineChart data={scores} color={COLORS.accent} />
            <View style={styles.chartLabels}>
              {sparseChartLabels(labels).map(({ label, key }) => (
                <Text key={key} style={styles.chartLabel} numberOfLines={1}>{label}</Text>
              ))}
            </View>
            </GlassCard>
          </Animated.View>

          <SectionLabel label="Body Fat %" />

          {/* ── Body fat chart ───────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(130).duration(350)}>
            <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Body Fat %</Text>
              {bfTrend.text ? (
                <Badge variant={bfTrend.variant} size="sm">{bfTrend.text}</Badge>
              ) : null}
            </View>
            <LineChart data={bodyFats} color={COLORS.amber} />
            <View style={styles.chartLabels}>
              {sparseChartLabels(labels).map(({ label, key }) => (
                <Text key={key} style={styles.chartLabel} numberOfLines={1}>{label}</Text>
              ))}
            </View>
            </GlassCard>
          </Animated.View>

          <SectionLabel label="V-Taper Score" />

          {/* ── V-Taper chart ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(180).duration(350)}>
            <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>V-Taper Score</Text>
              {vtaperTrend.text ? (
                <Badge variant={vtaperTrend.variant} size="sm">{vtaperTrend.text}</Badge>
              ) : null}
            </View>
            <LineChart data={vtapers} color={COLORS.indigo} />
            <View style={styles.chartLabels}>
              {sparseChartLabels(labels).map(({ label, key }) => (
                <Text key={key} style={styles.chartLabel} numberOfLines={1}>{label}</Text>
              ))}
            </View>
            </GlassCard>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: {
    paddingHorizontal: LAYOUT.pagePad,
    paddingBottom: LAYOUT.tabScrollBottom,
  },

  // Empty state extras
  emptyMetaCard: {
    gap: SPACING.sm,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    alignSelf: 'stretch',
  },
  emptyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyMetaIcon: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMetaLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
  },

  // ── Delta summary row
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  summaryCard: {
    flex: 1,
    gap: SPACING.xs,
    marginBottom: 0,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
  },
  summaryDelta: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },

  // ── Chart cards
  chartCard: {
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  chartTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PAD.left,
    marginTop: 4,
  },
  chartLabel: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
});
