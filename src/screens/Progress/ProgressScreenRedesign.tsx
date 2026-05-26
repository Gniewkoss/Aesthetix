import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Polyline, Circle, Line, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '../../store/useProgressStore';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { REDESIGN } from '../../theme/redesign-new';

const { COLORS, FONTS, SPACING, RADIUS, SHADOWS, LAYOUT } = REDESIGN;
const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - LAYOUT.screenPad * 2 - SPACING.base * 2;
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
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
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

export function ProgressScreenRedesign() {
  const { entries } = useProgressStore();

  const overallScores = useMemo(() => entries.map((s: any) => s.overallScore), [entries]);
  const bodyFatProgress = useMemo(() => entries.map((s: any) => s.bodyFat), [entries]);
  const symmetryProgress = useMemo(() => entries.map((s: any) => s.symmetryScore), [entries]);

  const hasData = entries.length >= 2;

  if (!hasData) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageHeader variant="tab" title="Progress" subtitle="Track your growth" />
          <EmptyState
            iconName="trending-up-outline"
            iconColor={COLORS.success}
            title="No progress data yet"
            subtitle={`Complete multiple scans to see your progress\ntrends and improvements over time.`}
          >
            <Button
              variant="default"
              size="lg"
              onPress={() => {}}
            >
              Run a Scan
            </Button>
          </EmptyState>
        </SafeAreaView>
      </View>
    );
  }

  const firstScore = overallScores[0];
  const latestScore = overallScores[overallScores.length - 1];
  const totalGain = latestScore - firstScore;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageHeader variant="tab" title="Progress" subtitle={`${entries.length} scan${entries.length !== 1 ? 's' : ''}`} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Starting Score</Text>
              <Text style={styles.statValue}>{firstScore}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Current Score</Text>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{latestScore}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Gain</Text>
              <Text style={[styles.statValue, { color: totalGain >= 0 ? COLORS.success : COLORS.status.poor }]}>
                {totalGain >= 0 ? '+' : ''}{totalGain}
              </Text>
            </View>
          </Animated.View>

          {/* Charts */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <Text style={styles.sectionTitle}>Overall Score Trend</Text>
            <View style={styles.chartCard}>
              <LineChart data={overallScores} color={COLORS.primary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(350)}>
            <Text style={styles.sectionTitle}>Body Fat Trend</Text>
            <View style={styles.chartCard}>
              <LineChart data={bodyFatProgress} color={COLORS.status.poor} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <Text style={styles.sectionTitle}>Symmetry Trend</Text>
            <View style={styles.chartCard}>
              <LineChart data={symmetryProgress} color={COLORS.success} />
            </View>
          </Animated.View>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },

  scroll: {
    padding: LAYOUT.screenPad,
    gap: SPACING.lg,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  statBox: {
    flex: 1,
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },

  statLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs,
  },

  statValue: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONTS.family.heading,
    color: COLORS.primary,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },

  chartCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
});
