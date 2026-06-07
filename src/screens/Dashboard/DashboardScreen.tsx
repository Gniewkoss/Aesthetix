import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { RadarChart, RADAR_LABEL_PAD } from '../../components/ui/RadarChart';
import { BodyAssessmentCard } from '../../components/body/BodyAssessmentCard';
import { MUSCLE_GROUP_KEYS, MUSCLE_GROUP_META } from '../../constants';
import { MuscleGroupKey } from '../../types';
import { C, T, R, S, LAYOUT, E, SCORE_CIRCLE_TEXT, scoreColor } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { AmbientGlow } from './home/AmbientGlow';
import { VoltRing } from './home/VoltRing';
import { AnimatedCount } from './home/AnimatedCount';
import { PhysiqueScoreHero } from '../../components/report/PhysiqueScoreHero';
import { useReducedMotion } from './home/useReducedMotion';
import { ScoreBarRow } from './report/ScoreBarRow';
import { MuscleRow } from './report/MuscleRow';
import { IssueRow } from './report/IssueRow';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const BREAKDOWN: { key: 'symmetryScore' | 'vTaperScore' | 'postureScore' | 'aestheticsScore' | 'proportionsScore' | 'athleticismScore'; label: string }[] = [
  { key: 'symmetryScore', label: 'Symmetry' },
  { key: 'vTaperScore', label: 'V-Taper' },
  { key: 'postureScore', label: 'Posture' },
  { key: 'aestheticsScore', label: 'Aesthetics' },
  { key: 'proportionsScore', label: 'Proportions' },
  { key: 'athleticismScore', label: 'Athleticism' },
];

function SectionLabel({ children }: { children: string }) {
  return <Text style={[T.overline, styles.sectionLabel]}>{children}</Text>;
}

export function DashboardScreen({ navigation, route }: Props) {
  const reduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const { currentAnalysis, history } = useAnalysisStore();
  const analysis = useMemo(() => {
    const requestedId = route.params?.analysisId;
    if (requestedId) {
      return history.find((s) => s.id === requestedId) ?? currentAnalysis;
    }
    return currentAnalysis ?? history[0] ?? null;
  }, [route.params?.analysisId, history, currentAnalysis]);

  const radarSize = useMemo(() => {
    const cardInner = screenWidth - LAYOUT.screenX * 2 - LAYOUT.cardPad * 2;
    return Math.max(220, cardInner - RADAR_LABEL_PAD * 2);
  }, [screenWidth]);

  const radarData = useMemo(() => {
    if (!analysis) return [];
    const mg = analysis.muscleGroups;
    const points: { label: string; value: number }[] = [];
    if (mg.shoulders.visible) points.push({ label: 'Shoulders', value: mg.shoulders.score });
    if (mg.chest.visible) points.push({ label: 'Chest', value: mg.chest.score });
    if (mg.back.visible) points.push({ label: 'Back', value: mg.back.score });
    const arms = [mg.biceps, mg.triceps].filter((m) => m.visible).map((m) => m.score);
    if (arms.length) points.push({ label: 'Arms', value: Math.round(arms.reduce((a, b) => a + b, 0) / arms.length) });
    if (mg.abs.visible) points.push({ label: 'Core', value: mg.abs.score });
    const legs = [mg.quads, mg.calves].filter((m) => m.visible).map((m) => m.score);
    if (legs.length) points.push({ label: 'Legs', value: Math.round(legs.reduce((a, b) => a + b, 0) / legs.length) });
    return points;
  }, [analysis]);

  const analyzedMuscleKeys = useMemo(
    () =>
      !analysis
        ? []
        : [...MUSCLE_GROUP_KEYS]
            .filter((key) => analysis.muscleGroups[key].visible)
            .sort((a, b) => analysis.muscleGroups[b].score - analysis.muscleGroups[a].score),
    [analysis],
  );

  const visiblePriorityAreas = useMemo(
    () => (!analysis ? [] : analysis.priorityAreas.filter((a) => analysis.muscleGroups[a as MuscleGroupKey]?.visible)),
    [analysis],
  );

  if (!analysis) {
    return (
      <View style={styles.root}>
        <AmbientGlow />
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <ScreenHeader title="Physique Report" onBack={() => navigation.goBack()} />
          <View style={styles.empty}>
            <VoltRing score={0} size={104} strokeWidth={8} instant>
              <Ionicons name="scan-outline" size={28} color={C.volt} />
            </VoltRing>
            <Text style={[T.title, { color: C.text, marginTop: S.xl }]}>No report found</Text>
            <Text style={[T.body, { color: C.text2, textAlign: 'center', marginTop: S.sm }]}>
              Run a new AI scan to generate your physique report.
            </Text>
            <ObsButton title="Start AI scan" onPress={() => navigation.navigate('Upload')} glow icon="arrow-forward" style={{ marginTop: S['2xl'], paddingHorizontal: S['2xl'] }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const col = scoreColor(analysis.overallScore);
  const date = new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const handleMusclePress = (key: MuscleGroupKey) =>
    navigation.navigate('MuscleDetail', { muscleKey: key, analysis: analysis.muscleGroups[key] });

  const enter = (i: number) => reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Physique Report" subtitle={date} onBack={() => navigation.goBack()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero verdict */}
          <Animated.View entering={enter(0)}>
            <PhysiqueScoreHero analysis={analysis} reduceMotion={reduceMotion} showSummary />
          </Animated.View>

          {/* Visibility notice */}
          {analysis.notVisibleBodyParts.length > 0 && (
            <Animated.View entering={enter(1)} style={styles.noticeCard}>
              <View style={styles.noticeRow}>
                <Ionicons name="eye-outline" size={15} color={C.volt} />
                <Text style={[T.caption, { color: C.text2, flex: 1 }]}>Analyzed: {analysis.visibleBodyParts.join(', ')}</Text>
              </View>
              <View style={[styles.noticeRow, { marginTop: S.sm }]}>
                <Ionicons name="eye-off-outline" size={15} color={C.text3} />
                <Text style={[T.caption, { color: C.text3, flex: 1 }]}>Not in frame: {analysis.notVisibleBodyParts.join(', ')}</Text>
              </View>
            </Animated.View>
          )}

          {/* Score breakdown */}
          <Animated.View entering={enter(2)}>
            <SectionLabel>SCORE BREAKDOWN</SectionLabel>
            <View style={styles.card}>
              {BREAKDOWN.map((b, i) => (
                <ScoreBarRow key={b.key} label={b.label} score={analysis[b.key]} delay={i * 70} reduceMotion={reduceMotion} />
              ))}
            </View>
          </Animated.View>

          {/* Radar */}
          {radarData.length > 0 && (
            <Animated.View entering={enter(3)}>
              <SectionLabel>PHYSIQUE RADAR</SectionLabel>
              <View style={[styles.card, styles.radarCard]}>
                <RadarChart data={radarData} size={radarSize} color={C.volt} />
              </View>
            </Animated.View>
          )}

          {/* Potential */}
          <Animated.View entering={enter(4)}>
            <SectionLabel>POTENTIAL ANALYSIS</SectionLabel>
            <View style={[styles.card, { borderColor: 'rgba(244,183,64,0.30)', backgroundColor: 'rgba(244,183,64,0.06)' }]}>
              <View style={styles.potentialRow}>
                <View style={styles.potentialBlock}>
                  <Text style={[T.overline, { color: C.text3 }]}>NOW</Text>
                  <AnimatedCount value={analysis.overallScore} instant={reduceMotion} style={[T.heroNum, { fontSize: 40, lineHeight: 44, color: col }]} />
                </View>
                <Ionicons name="arrow-forward" size={20} color={C.warning} />
                <View style={styles.potentialBlock}>
                  <Text style={[T.overline, { color: C.text3 }]}>POTENTIAL</Text>
                  <AnimatedCount value={analysis.predictedPotentialScore} instant={reduceMotion} style={[T.heroNum, { fontSize: 40, lineHeight: 44, color: C.warning }]} />
                </View>
              </View>
              <Text style={[T.bodySm, { color: C.text2, marginTop: S.md, lineHeight: 21 }]}>{analysis.glowUpPrediction}</Text>
            </View>
          </Animated.View>

          {/* Issues */}
          {analysis.issuesDetected.length > 0 && (
            <Animated.View entering={enter(5)}>
              <View style={styles.sectionRow}>
                <SectionLabel>ISSUES DETECTED</SectionLabel>
                <View style={styles.countPill}><Text style={[T.overline, { color: C.danger }]}>{analysis.issuesDetected.length}</Text></View>
              </View>
              {analysis.issuesDetected.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
            </Animated.View>
          )}

          {/* Body heat map */}
          <BodyAssessmentCard muscleGroups={analysis.muscleGroups} entering={reduceMotion ? undefined : FadeInDown.duration(STAGGER_BASE_MS)} />

          {analyzedMuscleKeys.length > 0 && (
            <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(300)}>
              <SectionLabel>MUSCLE GROUP ANALYSIS</SectionLabel>
              {analyzedMuscleKeys.map((key) => (
                <MuscleRow
                  key={key}
                  muscleKey={key}
                  analysis={analysis.muscleGroups[key]}
                  onPress={() => handleMusclePress(key)}
                />
              ))}
            </Animated.View>
          )}

          {/* Priority focus */}
          {visiblePriorityAreas.length > 0 && (
            <View>
              <SectionLabel>PRIORITY FOCUS</SectionLabel>
              <View style={styles.card}>
                {visiblePriorityAreas.map((area, i) => (
                  <View key={area} style={[styles.priorityRow, i < visiblePriorityAreas.length - 1 && styles.priorityBorder]}>
                    <View style={[styles.priorityNum, { backgroundColor: i === 0 ? C.danger + '1A' : C.voltDim }]}>
                      <Text style={[SCORE_CIRCLE_TEXT, { fontSize: 13, lineHeight: 16, color: i === 0 ? C.danger : C.volt }]}>{i + 1}</Text>
                    </View>
                    <View>
                      <Text style={[T.body, { color: C.text, fontSize: 15 }]}>{MUSCLE_GROUP_META[area as MuscleGroupKey]?.label ?? area}</Text>
                      <Text style={[T.caption, { color: C.text3 }]}>Focus zone {i + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* CTA */}
          <ObsButton
            title="View full improvement plan"
            onPress={() =>
              navigation.navigate('MainTabs', {
                screen: 'Recommendations',
                params: { tab: 'plan' },
              })
            }
            glow
            icon="arrow-forward"
            style={{ marginTop: S.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: LAYOUT.screenX },

  noticeCard: {
    backgroundColor: C.surface1, borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.base, marginBottom: LAYOUT.cardGap,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },

  sectionLabel: { color: C.text3, marginTop: LAYOUT.sectionGap - S.md, marginBottom: S.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  countPill: { backgroundColor: C.danger + '1A', borderWidth: 1, borderColor: C.danger + '38', borderRadius: R.pill, paddingHorizontal: S.sm, paddingVertical: 2, marginTop: LAYOUT.sectionGap - S.md, marginBottom: S.md },

  card: { ...E.card, borderRadius: R.xl, padding: LAYOUT.cardPad },
  radarCard: { alignItems: 'center', paddingVertical: S.md, paddingHorizontal: S.sm },
  center: { alignItems: 'center' },

  potentialRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  potentialBlock: { alignItems: 'center', gap: 2, flex: 1 },

  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.md },
  priorityBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  priorityNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
