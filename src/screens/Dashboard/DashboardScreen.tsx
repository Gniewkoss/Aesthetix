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
import { RadarChart } from '../../components/ui/RadarChart';
import { MuscleGroupCard } from '../../components/analysis/MuscleGroupCard';
import { BodyAssessmentCard } from '../../components/body/BodyAssessmentCard';
import { IssueCard } from '../../components/analysis/IssueCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionLabel } from '../../components/common/SectionLabel';
import {
  COLORS, FONT_FAMILY, FONTS, LAYOUT, SPACING, RADIUS, TRACKING,
  getScoreColor, getScoreLabel,
} from '../../theme';
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
  const scoreLabel = getScoreLabel(analysis.overallScore);

  const radarData = useMemo(() => {
    const mg = analysis.muscleGroups;
    const points: { label: string; value: number }[] = [];

    if (mg.shoulders.visible) points.push({ label: 'Shoulders', value: mg.shoulders.score });
    if (mg.chest.visible)     points.push({ label: 'Chest',     value: mg.chest.score     });
    if (mg.back.visible)      points.push({ label: 'Back',      value: mg.back.score      });

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
    <Animated.View entering={FadeIn.duration(400)} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader
          variant="push"
          title="Physique Report"
          subtitle={date}
          onBack={() => navigation.goBack()}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Score hero card — photo thumbnail integrated ─── */}
          <Animated.View entering={FadeInDown.duration(350)} style={[styles.heroCard, { borderColor: scoreColor + '20' }]}>
            {/* Top accent bar */}
            <View style={[styles.heroAccentBar, { backgroundColor: scoreColor }]} />

            <View style={styles.heroInner}>
              {/* Score data + photo side by side */}
              <View style={styles.heroTop}>
                <View style={styles.heroScoreLeft}>
                  <Text style={styles.heroEyebrow}>OVERALL PHYSIQUE SCORE</Text>
                  <Text style={[styles.heroScoreNumber, { color: scoreColor }]}>
                    {analysis.overallScore}
                  </Text>
                  <View style={[styles.heroScoreLabelBadge, { backgroundColor: scoreColor + '14', borderColor: scoreColor + '30' }]}>
                    <Text style={[styles.heroScoreLabelText, { color: scoreColor }]}>{scoreLabel}</Text>
                  </View>

                  {/* Three key metrics inline */}
                  <View style={styles.heroMetricsRow}>
                    <View style={styles.heroMetric}>
                      <Text style={styles.heroMetricValue}>{analysis.bodyFatRange ?? `${analysis.bodyFat}%`}</Text>
                      <Text style={styles.heroMetricLabel}>Body Fat</Text>
                    </View>
                    <View style={styles.heroMetricDivider} />
                    <View style={styles.heroMetric}>
                      <Text style={styles.heroMetricValue}>{analysis.symmetryScore}</Text>
                      <Text style={styles.heroMetricLabel}>Symmetry</Text>
                    </View>
                    <View style={styles.heroMetricDivider} />
                    <View style={styles.heroMetric}>
                      <Text style={styles.heroMetricValue}>{analysis.vTaperScore}</Text>
                      <Text style={styles.heroMetricLabel}>V-Taper</Text>
                    </View>
                  </View>
                </View>

                {/* Photo thumbnail — portrait crop at natural ratio, OR ring fallback */}
                {analysis.imageUris[0] ? (
                  <View style={styles.heroPhotoWrap}>
                    <Image
                      source={{ uri: analysis.imageUris[0] }}
                      style={styles.heroPhoto}
                      resizeMode="cover"
                    />
                    {/* Subtle vignette on photo edges */}
                    <LinearGradient
                      colors={['rgba(15,15,21,0.18)', 'transparent', 'rgba(15,15,21,0.28)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                  </View>
                ) : (
                  <CircularProgress score={analysis.overallScore} size={100} strokeWidth={8} showLabel={false} />
                )}
              </View>

              {/* Summary below the side-by-side row */}
              <Text style={styles.heroSummary}>{analysis.summary}</Text>
            </View>
          </Animated.View>

          {/* ── Visibility notice ───────────────────────────── */}
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

          {/* ── Score breakdown ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(110).duration(350)} style={styles.card}>
            <SectionLabel label="Score Breakdown" tier="title" noTopMargin />
            <ScoreBar label="Symmetry"    score={analysis.symmetryScore}    delay={0}   />
            <ScoreBar label="V-Taper"     score={analysis.vTaperScore}      delay={60}  />
            <ScoreBar label="Posture"     score={analysis.postureScore}      delay={120} />
            <ScoreBar label="Aesthetics"  score={analysis.aestheticsScore}   delay={180} />
            <ScoreBar label="Proportions" score={analysis.proportionsScore}  delay={240} />
            <ScoreBar label="Athleticism" score={analysis.athleticismScore}  delay={300} />
          </Animated.View>

          {/* ── Radar chart ──────────────────────────────────── */}
          {radarData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.card}>
              <SectionLabel label="Physique Radar" tier="title" noTopMargin />
              <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
                <RadarChart data={radarData} size={220} color={COLORS.accent} />
              </View>
            </Animated.View>
          )}

          {/* ── Potential analysis ───────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.potentialCard}>
            <View style={styles.potentialHeader}>
              <View style={styles.potentialIconWrap}>
                <Ionicons name="sparkles-outline" size={15} color={COLORS.indigo} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.potentialTitle}>Potential Analysis</Text>
                <Text style={styles.potentialScore}>
                  Predicted peak:{' '}
                  <Text style={{ color: COLORS.indigo, fontFamily: FONT_FAMILY.bodyBold }}>
                    {analysis.predictedPotentialScore}/100
                  </Text>
                </Text>
              </View>
            </View>
            <Text style={styles.potentialText}>{analysis.glowUpPrediction}</Text>
          </Animated.View>

          {/* ── Issues detected ──────────────────────────────── */}
          {analysis.issuesDetected.length > 0 && (
            <View>
              <SectionLabel label={`Issues Detected  (${analysis.issuesDetected.length})`} tier="title" />
              {analysis.issuesDetected.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </View>
          )}

          {/* ── Muscle heat map ──────────────────────────────── */}
          <BodyAssessmentCard
            muscleGroups={analysis.muscleGroups}
            entering={FadeInDown.delay(220).duration(350)}
          />

          {/* ── Per-muscle analysis ──────────────────────────── */}
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

          {/* ── Priority focus areas ─────────────────────────── */}
          <View style={styles.card}>
            <SectionLabel label="Priority Focus Areas" tier="title" noTopMargin />
            {visiblePriorityAreas.map((area, i) => (
              <View key={i} style={styles.priorityRow}>
                <View style={[
                  styles.priorityNum,
                  { backgroundColor: i === 0 ? COLORS.redDim : COLORS.indigoDim },
                ]}>
                  <Text style={[
                    styles.priorityNumText,
                    { color: i === 0 ? COLORS.red : COLORS.indigo },
                  ]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={styles.priorityText}>
                  {MUSCLE_GROUP_META[area as MuscleGroupKey]?.label ?? area}
                </Text>
              </View>
            ))}
          </View>

          {/* ── CTA ──────────────────────────────────────────── */}
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
  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING.xl },

  // ── Score hero card
  heroCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    marginBottom: LAYOUT.cardGap,
    overflow: 'hidden',
  },
  heroAccentBar: {
    height: 3,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
  },
  heroInner: {
    padding: LAYOUT.cardPad,
  },
  // Side-by-side: score data (left) + photo/ring (right)
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.base,
    marginBottom: SPACING.base,
  },
  heroScoreLeft: { flex: 1 },
  heroEyebrow: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
    marginBottom: SPACING.xs,
  },
  heroScoreNumber: {
    fontSize: FONTS.sizes['5xl'],        // 56 — the hero number
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['5xl'],
  },
  heroScoreLabelBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginTop: SPACING.sm,
  },
  heroScoreLabelText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
  },
  // Three key metrics below the score label
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.base,
  },
  heroMetric: { alignItems: 'center', gap: 2 },
  heroMetricValue: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
  },
  heroMetricLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  heroMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.border.hairline,
  },
  // Photo thumbnail — portrait crop, no awkward landscape stretch
  heroPhotoWrap: {
    width: 110,
    height: 148,                         // 3:4-ish — correct for body photos
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    flexShrink: 0,
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroSummary: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.65,
    paddingTop: SPACING.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.hairline,
  },

  // ── Visibility notice
  visibilityCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    marginBottom: LAYOUT.cardGap,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  visibilityLabel: {
    color: COLORS.text.secondary,
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

  // ── Generic content card
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: LAYOUT.cardPad,            // 24
    marginBottom: LAYOUT.cardGap,
  },

  // ── Potential analysis
  potentialCard: {
    backgroundColor: COLORS.indigoDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.indigoBorder,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.indigo,
  },
  potentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  potentialIconWrap: {
    width: 30,
    height: 30,
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

  // ── Priority rows
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  priorityNum: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
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
