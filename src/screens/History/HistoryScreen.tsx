import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { C, T, R, S, LAYOUT, E, BTN_LABEL } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { PressableScale } from '../Dashboard/home/PressableScale';
import { VoltRing } from '../Dashboard/home/VoltRing';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { TrendSummary } from './history/TrendSummary';
import { ScanTimelineItem } from './history/ScanTimelineItem';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TAB_CLEARANCE = 112;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const reduceMotion = useReducedMotion();
  const { history, setCurrentAnalysis } = useAnalysisStore();

  // Newest → oldest for the list.
  const sorted = useMemo(
    () => [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [history],
  );

  // Oldest → newest scores for the trend.
  const scores = useMemo(() => [...sorted].reverse().map((a) => a.overallScore), [sorted]);

  const openReport = (analysis: (typeof sorted)[number]) => {
    setCurrentAnalysis(analysis);
    navigation.navigate('Dashboard', { analysisId: analysis.id });
  };

  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  // ── Empty state ──────────────────────────────────────────────
  if (history.length === 0) {
    return (
      <View style={styles.root}>
        <AmbientGlow />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={[styles.header, styles.headerPad]}>
            <Text style={[T.h1, { color: C.text }]}>History</Text>
            <Text style={[T.bodySm, { color: C.text2 }]}>No scans yet</Text>
          </View>

          <View style={styles.empty}>
            <VoltRing score={0} size={108} strokeWidth={8} instant>
              <Ionicons name="scan-outline" size={30} color={C.volt} />
            </VoltRing>
            <Text style={[T.title, { color: C.text, textAlign: 'center', marginTop: S.xl }]}>
              No scans yet
            </Text>
            <Text style={[T.body, { color: C.text2, textAlign: 'center', marginTop: S.sm }]}>
              Your scan history appears here.{'\n'}Run your first AI analysis to get started.
            </Text>
            <PressableScale
              onPress={() => navigation.navigate('Upload')}
              accessibilityLabel="Start first scan"
              style={[styles.cta, E.glow]}
            >
              <Text style={[BTN_LABEL, { color: C.voltInk }]}>Start first scan</Text>
              <Ionicons name="arrow-forward" size={16} color={C.voltInk} />
            </PressableScale>
            <Text style={[T.caption, { color: C.text3, marginTop: S.md }]}>
              Free · Takes under 60 seconds
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Populated ────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <Animated.View entering={enter(0)} style={styles.header}>
            <Text style={[T.h1, { color: C.text }]}>History</Text>
            <Text style={[T.bodySm, { color: C.text2 }]}>
              {history.length} scan{history.length !== 1 ? 's' : ''}
            </Text>
          </Animated.View>

          {/* Trend summary */}
          <Animated.View entering={enter(1)} style={styles.section}>
            <TrendSummary scores={scores} reduceMotion={reduceMotion} />
          </Animated.View>

          {/* Timeline */}
          <Text style={[T.overline, styles.sectionLabel]}>ALL SCANS</Text>
          <View style={styles.timeline}>
            {sorted.map((analysis, i) => {
              const prevScore = sorted[i + 1]?.overallScore; // older scan
              const diff = prevScore !== undefined ? analysis.overallScore - prevScore : null;
              return (
                <Animated.View key={analysis.id} entering={enter(i + 2)}>
                  <ScanTimelineItem analysis={analysis} diff={diff} onPress={() => openReport(analysis)} />
                </Animated.View>
              );
            })}
          </View>
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

  header: {
    marginBottom: LAYOUT.sectionGap,
    gap: 2,
  },
  // Empty state renders the header outside the (padded) ScrollView.
  headerPad: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.sm,
  },

  section: { marginBottom: LAYOUT.sectionGap },
  sectionLabel: { color: C.text3, marginBottom: S.md },

  timeline: { gap: LAYOUT.cardGap },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: TAB_CLEARANCE,
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
