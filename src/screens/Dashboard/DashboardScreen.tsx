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
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { SettingsSection } from '../../components/common/SettingsSection';
import { SectionHeader } from '../../components/common/SectionHeader';
import { InfoRow } from '../../components/common/InfoRow';
import { GlassCard } from '../../components/ui/GlassCard';
import { MetricGrid } from '../../components/ui/MetricGrid';
import { Separator } from '../../components/ui/Separator';
import {
  COLORS, FONT_FAMILY, FONTS, LAYOUT, SPACING, RADIUS, TRACKING, SHADOWS,
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
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <PageHeader
            variant="push"
            title="Physique Report"
            onBack={() => navigation.goBack()}
          />
          <EmptyState
            iconName="scan-outline"
            iconColor={COLORS.accent}
            title="No report found"
            subtitle="Run a new AI scan to generate your physique report."
          >
            <Button
              variant="default"
              size="lg"
              onPress={() => navigation.navigate('Upload')}
              trailingIcon={<Ionicons name="arrow-forward" size={14} color={COLORS.text.onAccent} />}
            >
              Start AI Scan
            </Button>
          </EmptyState>
        </SafeAreaView>
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

          {/* ── Score hero: premium physique report ─── */}
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard style={[styles.heroCard, { borderColor: scoreColor + '20' }]} accentColor={scoreColor}>
              <LinearGradient
                colors={[scoreColor + '12', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.heroInner}>
                <View style={styles.heroTop}>
                  <View style={styles.heroScoreLeft}>
                    <Text style={styles.heroEyebrow}>OVERALL PHYSIQUE SCORE</Text>
                    <Text style={[styles.heroScoreNumber, { color: scoreColor }]}>
                      {analysis.overallScore}
                    </Text>
                    <Badge
                      variant="secondary"
                      size="sm"
                      style={{ alignSelf: 'flex-start', marginTop: SPACING.sm, backgroundColor: scoreColor + '14', borderColor: scoreColor + '30' }}
                      textStyle={{ color: scoreColor }}
                    >
                      {scoreLabel}
                    </Badge>
                  </View>

                  {analysis.imageUris[0] ? (
                    <View style={styles.heroPhotoWrap}>
                      <Image
                        source={{ uri: analysis.imageUris[0] }}
                        style={styles.heroPhoto}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['rgba(6,6,9,0.2)', 'transparent', 'rgba(6,6,9,0.35)']}
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

                <MetricGrid
                  items={[
                    { label: 'Body Fat', value: analysis.bodyFatRange ?? `${analysis.bodyFat}%` },
                    { label: 'Symmetry', value: analysis.symmetryScore },
                    { label: 'V-Taper', value: analysis.vTaperScore },
                  ]}
                />

                <Separator style={{ marginVertical: SPACING.sm }} />
                <Text style={styles.heroSummary}>{analysis.summary}</Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── Visibility notice ───────────────────────────── */}
          {analysis.notVisibleBodyParts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(50).duration(350)}>
              <GlassCard style={styles.visibilityCard}>
                <InfoRow
                  title="Analyzed"
                  subtitle={analysis.visibleBodyParts.join(', ')}
                  leftContent={<Ionicons name="eye-outline" size={16} color={COLORS.accent} />}
                  grouped={false}
                />
                <Separator />
                <InfoRow
                  title="Not in frame"
                  subtitle={analysis.notVisibleBodyParts.join(', ')}
                  leftContent={<Ionicons name="eye-off-outline" size={16} color={COLORS.text.disabled} />}
                  titleStyle={{ color: COLORS.text.muted }}
                  grouped={false}
                />
              </GlassCard>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(110).duration(350)}>
            <SettingsSection label="Score Breakdown" noTopMargin>
              <View style={styles.cardInner}>
                <ScoreBar label="Symmetry"    score={analysis.symmetryScore}    delay={0}   />
                <ScoreBar label="V-Taper"     score={analysis.vTaperScore}      delay={60}  />
                <ScoreBar label="Posture"     score={analysis.postureScore}      delay={120} />
                <ScoreBar label="Aesthetics"  score={analysis.aestheticsScore}   delay={180} />
                <ScoreBar label="Proportions" score={analysis.proportionsScore}  delay={240} />
                <ScoreBar label="Athleticism" score={analysis.athleticismScore}  delay={300} />
              </View>
            </SettingsSection>
          </Animated.View>

          {/* ── Radar chart ──────────────────────────────────── */}
          {radarData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(350)}>
              <SettingsSection label="Physique Radar">
                <View style={styles.cardInner}>
                  <View style={{ alignItems: 'center', marginTop: SPACING.xs }}>
                    <RadarChart data={radarData} size={220} color={COLORS.accent} />
                  </View>
                </View>
              </SettingsSection>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(180).duration(350)}>
            <GlassCard style={styles.potentialCard}>
              <LinearGradient
                colors={[COLORS.indigo + '18', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <SectionHeader
                title="Potential Analysis"
                icon="sparkles-outline"
                iconColor={COLORS.indigo}
              />
              <Text style={styles.potentialScore}>
                Predicted peak:{' '}
                <Text style={{ color: COLORS.indigo, fontFamily: FONT_FAMILY.bodyBold }}>
                  {analysis.predictedPotentialScore}/100
                </Text>
              </Text>
              <Text style={styles.potentialText}>{analysis.glowUpPrediction}</Text>
            </GlassCard>
          </Animated.View>

          {/* ── Issues detected ──────────────────────────────── */}
          {analysis.issuesDetected.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(350)}>
              <SectionHeader
                title="Issues Detected"
                icon="warning-outline"
                iconColor={COLORS.red}
                right={<Badge variant="destructive" size="sm">{String(analysis.issuesDetected.length)}</Badge>}
              />
              {analysis.issuesDetected.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </Animated.View>
          )}

          {/* ── Muscle heat map ──────────────────────────────── */}
          <BodyAssessmentCard
            muscleGroups={analysis.muscleGroups}
            entering={FadeInDown.delay(220).duration(350)}
          />

          {/* ── Per-muscle analysis ──────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(220).duration(350)}>
            <SectionHeader title="Muscle Group Analysis" icon="body-outline" />
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

          {/* ── Priority focus areas ─────────────────────────── */}
          {visiblePriorityAreas.length > 0 && (
            <Animated.View entering={FadeInDown.delay(260).duration(350)}>
              <SettingsSection label="Priority Focus">
                {visiblePriorityAreas.map((area, i) => (
                  <InfoRow
                    key={area}
                    title={MUSCLE_GROUP_META[area as MuscleGroupKey]?.label ?? area}
                    subtitle={`Focus zone ${i + 1}`}
                    showBorder={i < visiblePriorityAreas.length - 1}
                    leftContent={
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
                    }
                  />
                ))}
              </SettingsSection>
            </Animated.View>
          )}

          {/* ── CTA ──────────────────────────────────────────── */}
          <View style={styles.ctaRow}>
            <Button
              variant="default"
              size="lg"
              onPress={() => navigation.navigate('MainTabs')}
              trailingIcon={<Ionicons name="arrow-forward" size={14} color={COLORS.text.onAccent} />}
            >
              View Full Improvement Plan
            </Button>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING['3xl'] },

  heroCard: {
    marginBottom: LAYOUT.sectionGap,
    overflow: 'hidden',
  },
  heroInner: {
    position: 'relative',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.base,
    marginBottom: SPACING.sm,
  },
  heroScoreLeft: { flex: 1 },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: 1.6,
    marginBottom: SPACING.xs,
  },
  heroScoreNumber: {
    fontSize: 72,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
    lineHeight: 72,
    fontWeight: '800',
  },
  heroPhotoWrap: {
    width: 110,
    height: 148,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bg.secondary,
    borderWidth: StyleSheet.hairlineWidth,
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
  },

  visibilityCard: {
    marginBottom: LAYOUT.sectionGap,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },

  cardInner: {
    padding: SPACING.base,
  },

  potentialCard: {
    marginBottom: LAYOUT.sectionGap,
    overflow: 'hidden',
    borderColor: COLORS.indigoBorder,
  },
  potentialScore: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginBottom: SPACING.sm,
  },
  potentialText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.65,
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

  ctaRow: {
    marginTop: SPACING['2xl'],
    marginBottom: SPACING['3xl'],
    gap: SPACING.lg,
  },
});
