import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
import { COLORS, FONT_FAMILY, FONTS, SPACING, RADIUS, getScoreColor } from '../../theme';
import { MUSCLE_GROUP_KEYS, MUSCLE_GROUP_META } from '../../constants';
import { MuscleGroupKey } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { currentAnalysis } = useAnalysisStore();
  const analysis = currentAnalysis;

  if (!analysis) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.text.muted, fontFamily: FONT_FAMILY.body }}>No analysis found.</Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(analysis.overallScore);

  const radarData = useMemo(() => {
    const mg = analysis.muscleGroups;
    const points: { label: string; value: number }[] = [];

    if (mg.shoulders.visible) points.push({ label: 'Shoulders', value: mg.shoulders.score });
    if (mg.chest.visible) points.push({ label: 'Chest', value: mg.chest.score });
    if (mg.back.visible) points.push({ label: 'Back', value: mg.back.score });

    const armScores = [mg.biceps, mg.triceps].filter((m) => m.visible).map((m) => m.score);
    if (armScores.length > 0) {
      points.push({ label: 'Arms', value: Math.round(armScores.reduce((a, b) => a + b, 0) / armScores.length) });
    }

    if (mg.abs.visible) points.push({ label: 'Core', value: mg.abs.score });

    const legScores = [mg.quads, mg.calves].filter((m) => m.visible).map((m) => m.score);
    if (legScores.length > 0) {
      points.push({ label: 'Legs', value: Math.round(legScores.reduce((a, b) => a + b, 0) / legScores.length) });
    }

    return points;
  }, [analysis]);

  const sortedMuscleKeys = useMemo(
    () =>
      [...MUSCLE_GROUP_KEYS].sort((a, b) => {
        const aVisible = analysis.muscleGroups[a].visible;
        const bVisible = analysis.muscleGroups[b].visible;
        if (aVisible === bVisible) return 0;
        return aVisible ? -1 : 1;
      }),
    [analysis],
  );

  const visiblePriorityAreas = useMemo(
    () => analysis.priorityAreas.filter((area) => analysis.muscleGroups[area as MuscleGroupKey]?.visible),
    [analysis],
  );

  const handleMusclePress = (key: MuscleGroupKey) => {
    navigation.navigate('MuscleDetail', { muscleKey: key, analysis: analysis.muscleGroups[key] });
  };

  const date = new Date(analysis.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          title="Physique Report"
          subtitle={date}
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
              <Text style={styles.shareBtn}>SHARE</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Hero Score ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
            <View style={styles.heroInner}>
              <CircularProgress score={analysis.overallScore} size={190} strokeWidth={13} />
              <Text style={styles.heroTitle}>Overall Physique Score</Text>
              <Text style={styles.heroSummary}>{analysis.summary}</Text>
            </View>
          </Animated.View>

          {/* ── Visibility Notice ─────────────────────────── */}
          {analysis.notVisibleBodyParts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.visibilityCard}>
              <View style={styles.visibilityRow}>
                <Ionicons name="eye-outline" size={13} color={COLORS.accent} />
                <Text style={styles.visibilityLabel}>Analyzed: </Text>
                <Text style={styles.visibilityValue} numberOfLines={2}>
                  {analysis.visibleBodyParts.join(', ')}
                </Text>
              </View>
              <View style={[styles.visibilityRow, { marginTop: 5 }]}>
                <Ionicons name="eye-off-outline" size={13} color={COLORS.text.disabled} />
                <Text style={[styles.visibilityLabel, { color: COLORS.text.disabled }]}>Not in frame: </Text>
                <Text style={[styles.visibilityValue, { color: COLORS.text.disabled }]} numberOfLines={2}>
                  {analysis.notVisibleBodyParts.join(', ')}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Key Metrics ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.statsRow}>
              <StatPill label="Body Fat" value={analysis.bodyFatRange ?? `${analysis.bodyFat}%`} color={COLORS.amber} />
              <StatPill label="Symmetry" value={analysis.symmetryScore} color={COLORS.accent} />
              <StatPill label="V-Taper" value={analysis.vTaperScore} color={COLORS.purple} />
            </View>
            <View style={styles.statsRow}>
              <StatPill label="Posture" value={analysis.postureScore} color={COLORS.green} />
              <StatPill label="Aesthetics" value={analysis.aestheticsScore} color={COLORS.red} />
              <StatPill label="Athletic" value={analysis.athleticismScore} color={COLORS.amber} />
            </View>
          </Animated.View>

          {/* ── Score Breakdown ───────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(130).duration(400)} style={styles.card}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
            <ScoreBar label="Symmetry" score={analysis.symmetryScore} delay={0} />
            <ScoreBar label="V-Taper" score={analysis.vTaperScore} delay={60} />
            <ScoreBar label="Posture" score={analysis.postureScore} delay={120} />
            <ScoreBar label="Aesthetics" score={analysis.aestheticsScore} delay={180} />
            <ScoreBar label="Proportions" score={analysis.proportionsScore} delay={240} />
            <ScoreBar label="Athleticism" score={analysis.athleticismScore} delay={300} />
          </Animated.View>

          {/* ── Radar Chart ───────────────────────────────── */}
          {radarData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.card}>
              <Text style={styles.sectionTitle}>Physique Radar</Text>
              <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
                <RadarChart data={radarData} size={220} color={COLORS.accent} />
              </View>
            </Animated.View>
          )}

          {/* ── Potential Analysis ────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.potentialCard}>
            <View style={styles.potentialHeader}>
              <View style={styles.potentialIconWrap}>
                <Ionicons name="sparkles-outline" size={16} color={COLORS.purple} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.potentialTitle}>Potential Analysis</Text>
                <Text style={styles.potentialScore}>
                  Predicted score: <Text style={{ color: COLORS.purple }}>{analysis.predictedPotentialScore}/100</Text>
                </Text>
              </View>
            </View>
            <Text style={styles.potentialText}>{analysis.glowUpPrediction}</Text>
          </Animated.View>

          {/* ── Issues Detected ───────────────────────────── */}
          {analysis.issuesDetected.length > 0 && (
            <Animated.View entering={FadeInDown.delay(260).duration(400)}>
              <Text style={styles.sectionTitle}>Issues Detected ({analysis.issuesDetected.length})</Text>
              {analysis.issuesDetected.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </Animated.View>
          )}

          {/* ── Muscle Groups ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.sectionTitle}>Muscle Group Analysis</Text>
            {sortedMuscleKeys.map((key, i) => (
              <MuscleGroupCard
                key={key}
                muscleKey={key}
                analysis={analysis.muscleGroups[key]}
                onPress={analysis.muscleGroups[key].visible ? () => handleMusclePress(key) : undefined}
                index={i}
              />
            ))}
          </Animated.View>

          {/* ── Priority Areas ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(340).duration(400)} style={styles.card}>
            <Text style={styles.sectionTitle}>Priority Focus Areas</Text>
            {visiblePriorityAreas.map((area, i) => (
              <View key={i} style={styles.priorityRow}>
                <View style={[styles.priorityNum, { backgroundColor: i === 0 ? COLORS.redDim : COLORS.purpleDim }]}>
                  <Text style={[styles.priorityNumText, { color: i === 0 ? COLORS.red : COLORS.purple }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={styles.priorityText}>{MUSCLE_GROUP_META[area as MuscleGroupKey]?.label ?? area}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ── CTA ───────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(380).duration(400)} style={{ marginBottom: SPACING['3xl'] }}>
            <GradientButton
              title="View Full Improvement Plan"
              onPress={() => {}}
              variant="primary"
              size="lg"
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.base },
  shareBtn: {
    color: COLORS.accent,
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 1.2,
  },

  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.heading,
    marginBottom: SPACING.md,
    marginTop: SPACING.base,
    letterSpacing: 0.3,
  },

  visibilityCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  visibilityLabel: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  visibilityValue: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
    textTransform: 'capitalize',
  },

  heroCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.base,
    overflow: 'hidden',
  },
  heroInner: { alignItems: 'center', padding: SPACING.xl },
  heroTitle: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
  },
  heroSummary: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
    lineHeight: FONTS.sizes.sm * 1.65,
    marginTop: SPACING.sm,
  },

  statsRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  card: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },

  potentialCard: {
    backgroundColor: COLORS.purpleDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  potentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  potentialIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potentialTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  potentialScore: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  potentialText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.65,
  },

  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  priorityNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  priorityNumText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  priorityText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
});
