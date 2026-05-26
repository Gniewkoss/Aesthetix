import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
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
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { REDESIGN } from '../../theme/redesign-new';
import { MUSCLE_GROUP_KEYS, MUSCLE_GROUP_META } from '../../constants';
import { MuscleGroupKey } from '../../types';
import { getScoreColor, getScoreLabel } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const { COLORS, FONTS, SPACING, RADIUS, SHADOWS, LAYOUT, GRADIENTS } = REDESIGN;

/**
 * REDESIGNED DASHBOARD — BOLD DATA VISUALIZATION
 *
 * Design: Large score display, vibrant color-coded cards, grid layout
 * Layout: Hero card → metric cards → analysis sections
 * Vibe: Data-confident, athletic achievement, clear progress
 */

export function DashboardScreenRedesign({ navigation }: Props) {
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
            iconColor={COLORS.primary}
            title="No report found"
            subtitle="Run a new AI scan to generate your physique report."
          >
            <Button
              variant="default"
              size="lg"
              onPress={() => navigation.navigate('Upload')}
              trailingIcon={<Ionicons name="arrow-forward" size={14} color="#FFFFFF" />}
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

  const date = new Date(analysis.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader
          variant="push"
          title="Physique Report"
          subtitle={date}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ═══════════════════════════════════════════════════════════════
              HERO CARD: MASSIVE SCORE DISPLAY
          ═══════════════════════════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <LinearGradient
              colors={[scoreColor, scoreColor + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreHero}
            >
              <View style={styles.scoreHeroContent}>
                <Text style={styles.scoreHeroLabel}>PHYSIQUE SCORE</Text>
                <Text style={styles.scoreHeroNumber}>{analysis.overallScore}</Text>
                <Badge
                  variant="secondary"
                  size="default"
                  style={styles.scoreHeroBadge}
                >
                  {scoreLabel}
                </Badge>
              </View>

              {analysis.imageUris[0] && (
                <View style={styles.scoreHeroImage}>
                  <Image
                    source={{ uri: analysis.imageUris[0] }}
                    style={styles.scoreHeroImageContent}
                    resizeMode="cover"
                  />
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ═══════════════════════════════════════════════════════════════
              METRICS GRID: 3-COLUMN STAT CARDS
          ═══════════════════════════════════════════════════════════════ */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={styles.metricsGrid}
          >
            <MetricCard
              label="Body Fat"
              value={analysis.bodyFatRange ?? `${analysis.bodyFat}%`}
              color={COLORS.primary}
              icon="scale"
            />
            <MetricCard
              label="Symmetry"
              value={`${analysis.symmetryScore}%`}
              color={COLORS.success}
              icon="swap-horizontal"
            />
            <MetricCard
              label="V-Taper"
              value={`${analysis.vTaperScore}%`}
              color={COLORS.status.great}
              icon="diamond"
            />
          </Animated.View>

          {/* ═══════════════════════════════════════════════════════════════
              BREAKDOWN SECTION: SCORE BARS
          ═══════════════════════════════════════════════════════════════ */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(300)}
            style={styles.breakdownSection}
          >
            <Text style={styles.sectionTitle}>Score Breakdown</Text>

            <View style={styles.scoreBreakdown}>
              <ScoreBar label="Symmetry" score={analysis.symmetryScore} delay={0} />
              <ScoreBar label="V-Taper" score={analysis.vTaperScore} delay={50} />
              <ScoreBar label="Posture" score={analysis.postureScore} delay={100} />
              <ScoreBar label="Aesthetics" score={analysis.aestheticsScore} delay={150} />
            </View>
          </Animated.View>

          {/* ═══════════════════════════════════════════════════════════════
              BOTTOM SPACING
          ═══════════════════════════════════════════════════════════════ */}
          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

/**
 * METRIC CARD COMPONENT: Reusable stat display
 */
function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={[styles.metricCard, { borderColor: color }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
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
    gap: SPACING['3xl'],  // 48px gaps
  },

  // ─── SCORE HERO ────────────────────────────────────────────────────────────
  scoreHero: {
    ...SHADOWS.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    minHeight: 160,
  },

  scoreHeroContent: {
    flex: 1,
  },

  scoreHeroLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.heading,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },

  scoreHeroNumber: {
    fontSize: FONTS.sizes['5xl'],
    fontFamily: FONTS.family.display,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: FONTS.sizes['5xl'],
    marginBottom: SPACING.base,
  },

  scoreHeroBadge: {
    alignSelf: 'flex-start',
  },

  scoreHeroImage: {
    width: 100,
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  scoreHeroImageContent: {
    width: '100%',
    height: '100%',
  },

  // ─── METRICS GRID ──────────────────────────────────────────────────────────
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  metricCard: {
    flex: 1,
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },

  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },

  metricLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs,
  },

  metricValue: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.family.heading,
    fontWeight: '700',
  },

  // ─── BREAKDOWN SECTION ─────────────────────────────────────────────────────
  breakdownSection: {},

  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },

  scoreBreakdown: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    gap: SPACING.lg,
  },
});
