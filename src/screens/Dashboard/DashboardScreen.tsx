import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { ScoreBar } from '../../components/ui/ScoreBar';
import { StatPill } from '../../components/ui/StatPill';
import { RadarChart } from '../../components/ui/RadarChart';
import { MuscleGroupCard } from '../../components/analysis/MuscleGroupCard';
import { BodyAssessmentCard } from '../../components/body/BodyAssessmentCard';
import { IssueCard } from '../../components/analysis/IssueCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionLabel } from '../../components/common/SectionLabel';
import { COLORS, FONT_FAMILY, FONTS, SPACING, RADIUS, TRACKING, getScoreColor } from '../../theme';
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
        <PageHeader
          variant="push"
          title="Physique Report"
          subtitle={date}
          onBack={() => navigation.goBack()}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Scan hero with key metrics ─────────────────── */}
          {analysis.imageUris[0] ? (
            <Animated.View entering={FadeInDown.duration(350)} style={styles.scanHero}>
              <Image source={{ uri: analysis.imageUris[0] }} style={styles.scanHeroImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(6,6,9,0.55)', 'rgba(6,6,9,0.92)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.scanHeroMetrics}>
                <View style={styles.scanHeroMetric}>
                  <Text style={styles.scanHeroMetricLabel}>Overall Score</Text>
                  <Text style={[styles.scanHeroMetricValue, { color: scoreColor }]}>
                    {analysis.overallScore}
                  </Text>
                </View>
                <View style={styles.scanHeroMetricDivider} />
                <View style={styles.scanHeroMetric}>
                  <Text style={styles.scanHeroMetricLabel}>Symmetry</Text>
                  <Text style={styles.scanHeroMetricValue}>{analysis.symmetryScore}%</Text>
                </View>
                <View style={styles.scanHeroMetricDivider} />
                <View style={styles.scanHeroMetric}>
                  <Text style={styles.scanHeroMetricLabel}>Definition</Text>
                  <Text style={styles.scanHeroMetricValue}>{analysis.aestheticsScore}%</Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* ── Hero Score ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.heroCard}>
            <View style={styles.heroInner}>
              <CircularProgress score={analysis.overallScore} size={190} strokeWidth={13} />
              <Text style={styles.heroTitle}>Overall Physique Score</Text>
              <Text style={styles.heroSummary}>{analysis.summary}</Text>
            </View>
          </Animated.View>

          {/* ── Visibility Notice ─────────────────────────── */}
          {analysis.notVisibleBodyParts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.visibilityCard}>
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
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <SectionLabel label="Key Metrics" tier="title" noTopMargin />
            <View style={styles.statsRow}>
              <StatPill label="Body Fat" value={analysis.bodyFatRange ?? `${analysis.bodyFat}%`} color={COLORS.amber} />
              <StatPill label="Symmetry" value={analysis.symmetryScore} color={COLORS.accent} />
              <StatPill label="V-Taper" value={analysis.vTaperScore} color={COLORS.indigo} />
            </View>
            <View style={styles.statsRow}>
              <StatPill label="Posture" value={analysis.postureScore} color={COLORS.green} />
              <StatPill label="Aesthetics" value={analysis.aestheticsScore} color={COLORS.red} />
              <StatPill label="Athletic" value={analysis.athleticismScore} color={COLORS.amber} />
            </View>
          </Animated.View>

          {/* ── Score Breakdown ───────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(130).duration(350)} style={styles.card}>
            <SectionLabel label="Score Breakdown" tier="title" noTopMargin />
            <ScoreBar label="Symmetry" score={analysis.symmetryScore} delay={0} />
            <ScoreBar label="V-Taper" score={analysis.vTaperScore} delay={60} />
            <ScoreBar label="Posture" score={analysis.postureScore} delay={120} />
            <ScoreBar label="Aesthetics" score={analysis.aestheticsScore} delay={180} />
            <ScoreBar label="Proportions" score={analysis.proportionsScore} delay={240} />
            <ScoreBar label="Athleticism" score={analysis.athleticismScore} delay={300} />
          </Animated.View>

          {/* ── Radar Chart ───────────────────────────────── */}
          {radarData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.card}>
              <SectionLabel label="Physique Radar" tier="title" noTopMargin />
              <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
                <RadarChart data={radarData} size={220} color={COLORS.accent} />
              </View>
            </Animated.View>
          )}

          {/* ── Potential Analysis ────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(220).duration(350)} style={styles.potentialCard}>
            <View style={styles.potentialHeader}>
              <View style={styles.potentialIconWrap}>
                <Ionicons name="sparkles-outline" size={16} color={COLORS.indigo} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.potentialTitle}>Potential Analysis</Text>
                <Text style={styles.potentialScore}>
                  Predicted score: <Text style={{ color: COLORS.indigo }}>{analysis.predictedPotentialScore}/100</Text>
                </Text>
              </View>
            </View>
            <Text style={styles.potentialText}>{analysis.glowUpPrediction}</Text>
          </Animated.View>

          {/* ── Issues Detected ───────────────────────────── */}
          {analysis.issuesDetected.length > 0 && (
            <View>
              <SectionLabel label={`Issues Detected (${analysis.issuesDetected.length})`} tier="title" />
              {analysis.issuesDetected.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </View>
          )}

          {/* ── Muscle Heat Map ───────────────────────────── */}
          <BodyAssessmentCard
            muscleGroups={analysis.muscleGroups}
            entering={FadeInDown.delay(250).duration(350)}
          />

          {/* ── Muscle Groups ─────────────────────────────── */}
          <View>
            <SectionLabel label="Muscle Group Analysis" tier="title" />
            {sortedMuscleKeys.map((key, i) => (
              <MuscleGroupCard
                key={key}
                muscleKey={key}
                analysis={analysis.muscleGroups[key]}
                onPress={analysis.muscleGroups[key].visible ? () => handleMusclePress(key) : undefined}
                index={i}
              />
            ))}
          </View>

          {/* ── Priority Areas ────────────────────────────── */}
          <View style={styles.card}>
            <SectionLabel label="Priority Focus Areas" tier="title" />
            {visiblePriorityAreas.map((area, i) => (
              <View key={i} style={styles.priorityRow}>
                <View style={[styles.priorityNum, { backgroundColor: i === 0 ? COLORS.redDim : COLORS.indigoDim }]}>
                  <Text style={[styles.priorityNumText, { color: i === 0 ? COLORS.red : COLORS.indigo }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={styles.priorityText}>{MUSCLE_GROUP_META[area as MuscleGroupKey]?.label ?? area}</Text>
              </View>
            ))}
          </View>

          {/* ── CTA ───────────────────────────────────────── */}
          <View style={{ marginBottom: SPACING['3xl'] }}>
            <GradientButton
              title="View Full Improvement Plan"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Recommendations' })}
              variant="primary"
              size="lg"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.lg },

  scanHero: {
    height: 220,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    backgroundColor: COLORS.bg.card,
  },
  scanHeroImage: {
    width: '100%',
    height: '100%',
  },
  scanHeroMetrics: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  scanHeroMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  scanHeroMetricDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border.subtle,
    marginBottom: 4,
  },
  scanHeroMetricLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
  },
  scanHeroMetricValue: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
  },

  visibilityCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
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
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: 10,
    overflow: 'hidden',
  },
  heroInner: { alignItems: 'center', paddingVertical: SPACING['2xl'], paddingHorizontal: SPACING.xl },
  heroTitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
    marginTop: SPACING.base,
  },
  heroSummary: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
    lineHeight: FONTS.sizes.sm * 1.65,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },

  statsRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    marginBottom: 10,
  },

  potentialCard: {
    backgroundColor: COLORS.indigoDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.indigoBorder,
    padding: SPACING.base,
    marginBottom: 10,
  },
  potentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  potentialIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.indigoDim,
    borderWidth: 1,
    borderColor: COLORS.indigoBorder,
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
