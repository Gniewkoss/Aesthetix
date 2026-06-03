import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PhysiqueAnalysis } from '../../../types';
import { C, T, R, S, LAYOUT, E, scoreColor } from '../../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../../motion';
import { AnimatedCount } from '../../Dashboard/home/AnimatedCount';
import { PhysiqueScoreHero } from '../../../components/report/PhysiqueScoreHero';
import { PlanActionCard } from './PlanActionCard';

const TAB_CLEARANCE = 112;

function SectionHeader({ icon, color, title }: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color + '1A', borderColor: color + '38' }]}>
        <Ionicons name={icon} size={12} color={color} />
      </View>
      <Text style={[T.overline, styles.sectionTitle, { color: C.text2 }]}>{title.toUpperCase()}</Text>
    </View>
  );
}

export function PlanView({ analysis, reduceMotion }: { analysis: PhysiqueAnalysis; reduceMotion: boolean }) {
  const col = scoreColor(analysis.overallScore);
  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Animated.View entering={enter(0)}>
        <PhysiqueScoreHero analysis={analysis} reduceMotion={reduceMotion} />
      </Animated.View>

      {analysis.summary ? (
        <Animated.View entering={enter(1)} style={styles.card}>
          <SectionHeader icon="sparkles" color={C.volt} title="Coach assessment" />
          <Text style={[T.bodySm, { color: C.text2, marginTop: S.sm, lineHeight: 21 }]}>{analysis.summary}</Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(2)}>
        <SectionHeader icon="trophy-outline" color={C.volt} title="Improvement plan" />
        {analysis.improvementPlan.map((item) => (
          <PlanActionCard key={item.priority} item={item} />
        ))}
      </Animated.View>

      <Animated.View entering={enter(3)}>
        <SectionHeader icon="nutrition-outline" color={C.success} title="Nutrition protocol" />
        {analysis.dietaryRecommendations.map((rec, i) => (
          <View key={i} style={styles.dietCard}>
            <View style={[styles.dietBadge, { backgroundColor: C.success + '1A', borderColor: C.success + '38' }]}>
              <Text style={[T.overline, { color: C.success }]}>{rec.category.toUpperCase()}</Text>
            </View>
            <Text style={[T.label, { color: C.text, marginTop: S.sm }]}>{rec.recommendation}</Text>
            <Text style={[T.bodySm, { color: C.text2, marginTop: S.xs, lineHeight: 20 }]}>{rec.rationale}</Text>
          </View>
        ))}
      </Animated.View>

      {analysis.glowUpPrediction ? (
        <Animated.View entering={enter(4)}>
          <SectionHeader icon="trending-up" color={C.warning} title="Glow-up projection" />
          <View style={[styles.glowCard, { borderColor: C.warning + '38' }]}>
            <View style={styles.glowRow}>
              <View style={styles.glowBlock}>
                <Text style={[T.overline, { color: C.text3 }]}>NOW</Text>
                <AnimatedCount
                  value={analysis.overallScore}
                  instant={reduceMotion}
                  style={[T.metric, styles.glowMetric, { color: col }]}
                />
              </View>
              <Ionicons name="arrow-forward" size={18} color={C.warning} />
              <View style={styles.glowBlock}>
                <Text style={[T.overline, { color: C.text3 }]}>POTENTIAL</Text>
                <AnimatedCount
                  value={analysis.predictedPotentialScore}
                  instant={reduceMotion}
                  style={[T.metric, styles.glowMetric, { color: C.warning }]}
                />
              </View>
            </View>
            <Text style={[T.bodySm, { color: C.text2, marginTop: S.md, lineHeight: 21 }]}>{analysis.glowUpPrediction}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: TAB_CLEARANCE },

  card: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginTop: LAYOUT.sectionGap - S.md,
    marginBottom: S.md,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: R.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dietCard: {
    ...E.card,
    borderRadius: R.lg,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },
  dietBadge: { alignSelf: 'flex-start', paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.xs, borderWidth: 1 },

  glowCard: {
    backgroundColor: 'rgba(244,183,64,0.08)',
    borderWidth: 1,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
  },
  glowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glowBlock: { alignItems: 'center', gap: 2, flex: 1 },
  glowMetric: {
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
});
