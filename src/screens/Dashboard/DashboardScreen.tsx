import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { ScoreBar } from '../../components/ui/ScoreBar';
import { StatPill } from '../../components/ui/StatPill';
import { RadarChart } from '../../components/ui/RadarChart';
import { MuscleGroupCard } from '../../components/analysis/MuscleGroupCard';
import { IssueCard } from '../../components/analysis/IssueCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { COLORS, FONTS, SPACING, RADIUS, getScoreColor } from '../../theme';
import { MUSCLE_GROUP_KEYS, MUSCLE_GROUP_META } from '../../constants';
import { MuscleGroupKey } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { currentAnalysis } = useAnalysisStore();

  const analysis = currentAnalysis;

  if (!analysis) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.text.muted }}>No analysis found.</Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(analysis.overallScore);

  const radarData = useMemo(() => [
    { label: 'Shoulders', value: analysis.muscleGroups.shoulders.score },
    { label: 'Chest', value: analysis.muscleGroups.chest.score },
    { label: 'Back', value: analysis.muscleGroups.back.score },
    { label: 'Arms', value: Math.round((analysis.muscleGroups.biceps.score + analysis.muscleGroups.triceps.score) / 2) },
    { label: 'Core', value: analysis.muscleGroups.abs.score },
    { label: 'Legs', value: Math.round((analysis.muscleGroups.quads.score + analysis.muscleGroups.calves.score) / 2) },
  ], [analysis]);

  const handleMusclePress = (key: MuscleGroupKey) => {
    navigation.navigate('MuscleDetail', { muscleKey: key, analysis: analysis.muscleGroups[key] });
  };

  const date = new Date(analysis.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          title="Physique Report"
          subtitle={date}
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
              <Text style={{ color: COLORS.cyan, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold }}>
                SHARE
              </Text>
            </TouchableOpacity>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Hero Score ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.heroCard}>
            <LinearGradient
              colors={[scoreColor + '18', 'rgba(0,0,0,0)']}
              style={[StyleSheet.absoluteFill, { borderRadius: RADIUS['2xl'] }]}
            />
            <View style={styles.heroInner}>
              <CircularProgress score={analysis.overallScore} size={200} strokeWidth={14} />
              <Text style={styles.heroTitle}>Overall Physique Score</Text>
              <Text style={styles.heroSummary}>{analysis.summary}</Text>
            </View>
          </Animated.View>

          {/* ── Key Metrics ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.statsRow}>
              <StatPill label="Body Fat" value={`${analysis.bodyFat}%`} color={COLORS.orange} />
              <StatPill label="Symmetry" value={analysis.symmetryScore} color={COLORS.cyan} />
              <StatPill label="V-Taper" value={analysis.vTaperScore} color={COLORS.purple} />
            </View>
            <View style={styles.statsRow}>
              <StatPill label="Posture" value={analysis.postureScore} color={COLORS.green} />
              <StatPill label="Aesthetics" value={analysis.aestheticsScore} color={COLORS.pink} />
              <StatPill label="Athletic" value={analysis.athleticismScore} color={COLORS.yellow} />
            </View>
          </Animated.View>

          {/* ── Score Breakdown ───────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.card}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
            <ScoreBar label="Symmetry" score={analysis.symmetryScore} delay={0} />
            <ScoreBar label="V-Taper" score={analysis.vTaperScore} delay={80} />
            <ScoreBar label="Posture" score={analysis.postureScore} delay={160} />
            <ScoreBar label="Aesthetics" score={analysis.aestheticsScore} delay={240} />
            <ScoreBar label="Proportions" score={analysis.proportionsScore} delay={320} />
            <ScoreBar label="Athleticism" score={analysis.athleticismScore} delay={400} />
          </Animated.View>

          {/* ── Radar Chart ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
            <Text style={styles.sectionTitle}>Physique Radar</Text>
            <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
              <RadarChart data={radarData} size={230} color={COLORS.cyan} />
            </View>
          </Animated.View>

          {/* ── Glow-Up Prediction ────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <LinearGradient
              colors={['rgba(255,0,110,0.1)', 'rgba(123,47,190,0.08)']}
              style={styles.glowCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.glowHeader}>
                <Text style={styles.glowIcon}>✨</Text>
                <View>
                  <Text style={styles.glowTitle}>Glow-Up Prediction</Text>
                  <Text style={styles.glowPotential}>Potential: {analysis.predictedPotentialScore}/100</Text>
                </View>
              </View>
              <Text style={styles.glowText}>{analysis.glowUpPrediction}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ── Issues Detected ───────────────────────────── */}
          {analysis.issuesDetected.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Text style={styles.sectionTitle}>Issues Detected ({analysis.issuesDetected.length})</Text>
              {analysis.issuesDetected.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </Animated.View>
          )}

          {/* ── Muscle Groups ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)}>
            <Text style={styles.sectionTitle}>Muscle Group Analysis</Text>
            {MUSCLE_GROUP_KEYS.map((key, i) => (
              <MuscleGroupCard
                key={key}
                muscleKey={key}
                analysis={analysis.muscleGroups[key]}
                onPress={() => handleMusclePress(key)}
                index={i}
              />
            ))}
          </Animated.View>

          {/* ── Priority Areas ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.card}>
            <Text style={styles.sectionTitle}>Priority Focus Areas</Text>
            {analysis.priorityAreas.map((area, i) => (
              <View key={i} style={styles.priorityRow}>
                <View style={[styles.priorityNum, { backgroundColor: i === 0 ? COLORS.pink + '25' : COLORS.purple + '20' }]}>
                  <Text style={[styles.priorityNumText, { color: i === 0 ? COLORS.pink : COLORS.purple }]}>#{i + 1}</Text>
                </View>
                <Text style={styles.priorityText}>{MUSCLE_GROUP_META[area as MuscleGroupKey]?.label ?? area}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ── CTA ───────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(450).duration(500)} style={{ marginBottom: SPACING['3xl'] }}>
            <GradientButton
              title="View Full Improvement Plan →"
              onPress={() => {}}
              variant="primary"
              size="lg"
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.base },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.md,
    marginTop: SPACING.base,
  },
  heroCard: {
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: COLORS.glass.bg,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  heroInner: { alignItems: 'center', padding: SPACING.xl },
  heroTitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    letterSpacing: 1,
    marginTop: SPACING.md,
  },
  heroSummary: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    lineHeight: FONTS.sizes.sm * 1.6,
    marginTop: SPACING.sm,
  },
  statsRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  card: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  glowCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,0,110,0.2)',
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  glowHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  glowIcon: { fontSize: 28 },
  glowTitle: { color: COLORS.text.primary, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold },
  glowPotential: { color: COLORS.pink, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, marginTop: 2 },
  glowText: { color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, lineHeight: FONTS.sizes.sm * 1.65 },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  priorityNum: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.black },
  priorityText: { color: COLORS.text.primary, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold },
});
