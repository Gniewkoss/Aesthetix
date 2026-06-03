import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PhysiqueAnalysis } from '../../../types';
import { C, T, R, S, LAYOUT, E, scoreColor, scoreTier, accentCardStyle } from '../../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../../motion';
import { AnimatedCount } from '../../Dashboard/home/AnimatedCount';
import { VoltRing } from '../../Dashboard/home/VoltRing';
import { RingScore } from '../../Dashboard/home/RingScore';
import { PlanActionCard } from './PlanActionCard';

const TAB_CLEARANCE = 112;

function ScoreMeta({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={[T.caption, { color: C.text3 }]}>{label}</Text>
      <Text style={[T.label, { color: accent ?? C.text }]}>{value}</Text>
    </View>
  );
}

function SectionHeader({ icon, color, title }: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color + '1A', borderColor: color + '38' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[T.cardTitle, { color: C.text }]}>{title}</Text>
    </View>
  );
}

export function PlanView({ analysis, reduceMotion }: { analysis: PhysiqueAnalysis; reduceMotion: boolean }) {
  const col = scoreColor(analysis.overallScore);
  const tier = scoreTier(analysis.overallScore);
  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Score anchor */}
      <Animated.View entering={enter(0)} style={[styles.scoreStrip, accentCardStyle(col)]}>
        <View style={styles.ringWrap}>
          <VoltRing
            score={analysis.overallScore}
            size={76}
            strokeWidth={6}
            color={col}
            instant={reduceMotion}
          >
            <View style={styles.scoreInRing}>
              <RingScore
                value={analysis.overallScore}
                color={col}
                fontSize={26}
                instant={reduceMotion}
              />
            </View>
          </VoltRing>
        </View>

        <View style={styles.scoreMid}>
          <Text style={[T.overline, { color: C.text3 }]}>PHYSIQUE SCORE</Text>
          <View style={[styles.tierPill, { backgroundColor: col + '1A', borderColor: col + '40' }]}>
            <Text style={[T.overline, { color: col }]}>{tier.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.scoreRight}>
          <ScoreMeta label="Body fat" value={analysis.bodyFatRange ?? `${analysis.bodyFat}%`} />
          <ScoreMeta label="Potential" value={String(analysis.predictedPotentialScore)} accent={C.warning} />
          <ScoreMeta label="Symmetry" value={String(analysis.symmetryScore)} />
        </View>
      </Animated.View>

      {/* Coach assessment */}
      {analysis.summary ? (
        <Animated.View entering={enter(1)} style={styles.card}>
          <SectionHeader icon="sparkles" color={C.volt} title="Coach assessment" />
          <Text style={[T.body, { color: C.text2, marginTop: S.sm }]}>{analysis.summary}</Text>
        </Animated.View>
      ) : null}

      {/* Improvement plan */}
      <Animated.View entering={enter(2)}>
        <SectionHeader icon="trophy-outline" color={C.volt} title="Improvement plan" />
        {analysis.improvementPlan.map((item) => (
          <PlanActionCard key={item.priority} item={item} />
        ))}
      </Animated.View>

      {/* Nutrition protocol */}
      <Animated.View entering={enter(3)}>
        <SectionHeader icon="nutrition-outline" color={C.success} title="Nutrition protocol" />
        {analysis.dietaryRecommendations.map((rec, i) => (
          <View key={i} style={styles.dietCard}>
            <View style={[styles.dietBadge, { backgroundColor: C.success + '1A', borderColor: C.success + '38' }]}>
              <Text style={[T.overline, { color: C.success }]}>{rec.category.toUpperCase()}</Text>
            </View>
            <Text style={[T.cardTitle, { color: C.text, fontSize: 16, marginTop: S.sm }]}>{rec.recommendation}</Text>
            <Text style={[T.bodySm, { color: C.text2, marginTop: S.xs }]}>{rec.rationale}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Glow-up projection */}
      {analysis.glowUpPrediction ? (
        <Animated.View entering={enter(4)}>
          <SectionHeader icon="trending-up" color={C.warning} title="Glow-up projection" />
          <View style={[styles.glowCard, { borderColor: C.warning + '38' }]}>
            <View style={styles.glowRow}>
              <View style={styles.glowBlock}>
                <Text style={[T.overline, { color: C.text3 }]}>NOW</Text>
                <AnimatedCount value={analysis.overallScore} instant={reduceMotion} style={[T.heroNum, { fontSize: 40, lineHeight: 44, color: col }]} />
              </View>
              <Ionicons name="arrow-forward" size={20} color={C.warning} />
              <View style={styles.glowBlock}>
                <Text style={[T.overline, { color: C.text3 }]}>POTENTIAL</Text>
                <AnimatedCount value={analysis.predictedPotentialScore} instant={reduceMotion} style={[T.heroNum, { fontSize: 40, lineHeight: 44, color: C.warning }]} />
              </View>
            </View>
            <Text style={[T.bodySm, { color: C.text2, marginTop: S.md }]}>{analysis.glowUpPrediction}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: TAB_CLEARANCE },

  scoreStrip: {
    borderWidth: 1,
    borderRadius: R.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
    paddingVertical: S.lg,
    paddingHorizontal: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInRing: {
    marginTop: 5,
  },
  scoreMid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: S.sm,
    minHeight: 76,
    paddingHorizontal: S.xs,
  },
  scoreRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: S.sm,
    minHeight: 76,
  },
  metaRow: {
    alignItems: 'flex-end',
    gap: 1,
  },
  tierPill: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.pill, borderWidth: 1 },

  card: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: LAYOUT.sectionGap - S.md, marginBottom: S.md },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: R.sm,
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
});
