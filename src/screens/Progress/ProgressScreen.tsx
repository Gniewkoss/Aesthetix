import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useProgressStore } from '../../store/useProgressStore';
import { C, T, R, S, LAYOUT, E, BTN_LABEL } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { PressableScale } from '../Dashboard/home/PressableScale';
import { VoltRing } from '../Dashboard/home/VoltRing';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { SegmentedControl } from './progress/SegmentedControl';
import { MetricChartCard } from './progress/MetricChartCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - LAYOUT.screenX * 2 - LAYOUT.cardPad * 2;
const TAB_CLEARANCE = 112;

type MetricKey = 'score' | 'bodyFat' | 'vtaper';

const SEGMENTS = [
  { key: 'score', label: 'Score' },
  { key: 'bodyFat', label: 'Body Fat' },
  { key: 'vtaper', label: 'V-Taper' },
];

export function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const reduceMotion = useReducedMotion();
  const { entries, hydrate } = useProgressStore();
  const [metric, setMetric] = useState<MetricKey>('score');

  useFocusEffect(
    useCallback(() => {
      if (entries.length < 2) void hydrate();
    }, [entries.length, hydrate]),
  );

  const scores = useMemo(() => entries.map((e) => e.overallScore), [entries]);
  const bodyFats = useMemo(() => entries.map((e) => e.bodyFat), [entries]);
  const vtapers = useMemo(() => entries.map((e) => e.vTaperScore), [entries]);
  const labels = useMemo(
    () => entries.map((e) => {
      const d = new Date(e.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    [entries],
  );

  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  // ── Empty state ──────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <View style={styles.root}>
        <AmbientGlow />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.headerPad}>
            <Text style={[T.h1, { color: C.text }]}>Progress</Text>
            <Text style={[T.bodySm, { color: C.text2 }]}>No data yet</Text>
          </View>

          <View style={styles.empty}>
            <VoltRing score={0} size={108} strokeWidth={8} instant>
              <Ionicons name="trending-up-outline" size={30} color={C.volt} />
            </VoltRing>
            <Text style={[T.title, { color: C.text, textAlign: 'center', marginTop: S.xl }]}>
              Track your trajectory
            </Text>
            <Text style={[T.body, { color: C.text2, textAlign: 'center', marginTop: S.sm }]}>
              Progress charts appear after your first scan.{'\n'}Run 2+ scans to see trends over time.
            </Text>

            <View style={styles.previewCard}>
              {[
                { icon: 'analytics-outline', label: 'Score over time', color: C.volt },
                { icon: 'body-outline', label: 'Body fat tracking', color: C.warning },
                { icon: 'resize-outline', label: 'V-Taper progress', color: C.info },
              ].map((item) => (
                <View key={item.label} style={styles.previewRow}>
                  <View style={[styles.previewIcon, { backgroundColor: item.color + '1A' }]}>
                    <Ionicons name={item.icon as any} size={14} color={item.color} />
                  </View>
                  <Text style={[T.bodySm, { color: C.text }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <PressableScale
              onPress={() => navigation.navigate('Upload')}
              accessibilityLabel="Run a scan"
              style={[styles.cta, E.glow]}
            >
              <Text style={[BTN_LABEL, { color: C.voltInk }]}>Run a scan</Text>
              <Ionicons name="arrow-forward" size={16} color={C.voltInk} />
            </PressableScale>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Populated ────────────────────────────────────────────────
  const series: Record<MetricKey, { data: number[]; color: string; unit: string; label: string; higherIsBetter: boolean }> = {
    score:   { data: scores,   color: C.volt,    unit: '',  label: 'Score',    higherIsBetter: true },
    bodyFat: { data: bodyFats, color: C.warning, unit: '%', label: 'Body Fat', higherIsBetter: false },
    vtaper:  { data: vtapers,  color: C.info,    unit: '',  label: 'V-Taper',  higherIsBetter: true },
  };
  const active = series[metric];

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Header */}
          <Animated.View entering={enter(0)} style={styles.header}>
            <Text style={[T.h1, { color: C.text }]}>Progress</Text>
            <Text style={[T.bodySm, { color: C.text2 }]}>
              {entries.length} scan{entries.length !== 1 ? 's' : ''} tracked
            </Text>
          </Animated.View>

          {/* Metric switcher */}
          <Animated.View entering={enter(1)} style={styles.section}>
            <SegmentedControl options={SEGMENTS} value={metric} onChange={(k) => setMetric(k as MetricKey)} reduceMotion={reduceMotion} />
          </Animated.View>

          {/* Chart — re-keyed per metric so it redraws + recounts on toggle */}
          <Animated.View
            key={metric}
            entering={reduceMotion ? undefined : FadeIn.duration(220)}
            style={styles.section}
          >
            <MetricChartCard
              label={active.label}
              unit={active.unit}
              data={active.data}
              labels={labels}
              color={active.color}
              higherIsBetter={active.higherIsBetter}
              reduceMotion={reduceMotion}
              chartWidth={CHART_W}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  scroll: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.sm,
    paddingBottom: TAB_CLEARANCE,
  },

  header: { marginBottom: LAYOUT.sectionGap, gap: 2 },
  headerPad: { paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, gap: 2 },

  section: { marginBottom: LAYOUT.sectionGap },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: TAB_CLEARANCE,
  },
  previewCard: {
    alignSelf: 'stretch',
    gap: S.md,
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginTop: S['2xl'],
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  previewIcon: {
    width: 30,
    height: 30,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    height: 52,
    paddingHorizontal: S.xl,
    borderRadius: R.md,
    backgroundColor: C.volt,
    marginTop: S['2xl'],
  },
});
