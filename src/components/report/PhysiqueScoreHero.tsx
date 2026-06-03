import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PhysiqueAnalysis } from '../../types';
import { C, T, R, S, LAYOUT, E, scoreColor, scoreTier } from '../../theme/obsidian';
import { AnimatedCount } from '../../screens/Dashboard/home/AnimatedCount';
import { VoltRing } from '../../screens/Dashboard/home/VoltRing';

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const valueColor = accent ?? C.text;

  return (
    <View style={styles.metricCell}>
      <Text style={[T.metric, styles.metricValue, { color: valueColor }]}>{value}</Text>
      <Text style={[T.label, styles.metricLabel]}>{label}</Text>
    </View>
  );
}

interface PhysiqueScoreHeroProps {
  analysis: PhysiqueAnalysis;
  reduceMotion: boolean;
  /** When true, shows summary below metrics (Physique Report). */
  showSummary?: boolean;
}

/** Hero score card — shared by Physique Report and AI Coach plan. */
export function PhysiqueScoreHero({ analysis, reduceMotion, showSummary = false }: PhysiqueScoreHeroProps) {
  const col = scoreColor(analysis.overallScore);
  const tier = scoreTier(analysis.overallScore);

  return (
    <View style={[styles.hero, { borderColor: col + '2E' }]}>
      <LinearGradient
        colors={[col + '12', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.9 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          <Text style={[T.overline, { color: C.text3 }]}>OVERALL PHYSIQUE SCORE</Text>
          <View style={styles.scoreWrap}>
            <AnimatedCount
              value={analysis.overallScore}
              instant={reduceMotion}
              style={[T.heroNum, styles.scoreNum, { color: col }]}
            />
          </View>
          <View style={[styles.tierPill, { backgroundColor: col + '1A', borderColor: col + '40' }]}>
            <Text style={[T.overline, { color: col }]}>{tier.toUpperCase()}</Text>
          </View>
        </View>

        <VoltRing score={analysis.overallScore} size={92} strokeWidth={6} color={col} instant={reduceMotion}>
          <Ionicons name="flash" size={20} color={col} />
        </VoltRing>
      </View>

      <View style={styles.metricRow}>
        <Metric label="Body Fat" value={analysis.bodyFatRange ?? `${analysis.bodyFat}%`} />
        <View style={styles.metricDivider} />
        <Metric
          label="Symmetry"
          value={String(analysis.symmetryScore)}
          accent={scoreColor(analysis.symmetryScore)}
        />
        <View style={styles.metricDivider} />
        <Metric
          label="V-Taper"
          value={String(analysis.vTaperScore)}
          accent={scoreColor(analysis.vTaperScore)}
        />
      </View>

      {showSummary && analysis.summary ? (
        <>
          <View style={styles.separator} />
          <Text style={[T.bodySm, { color: C.text2, lineHeight: 22 }]}>{analysis.summary}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    overflow: 'hidden',
    marginBottom: LAYOUT.cardGap,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: S.base,
  },
  heroLeft: { flex: 1, minWidth: 0 },
  scoreWrap: {
    alignSelf: 'flex-start',
    marginTop: S.lg,
    marginBottom: 0,
  },
  scoreNum: {
    fontSize: 48,
    lineHeight: 52,
    height: 52,
    letterSpacing: -1.2,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlign: 'left',
    minWidth: 92,
  },
  tierPill: {
    alignSelf: 'flex-start',
    marginTop: -S.xs,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: R.pill,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: LAYOUT.cardPad,
    backgroundColor: C.surface2,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.borderMd,
    paddingVertical: S.md,
    paddingHorizontal: S.xs,
  },
  metricCell: { flex: 1, alignItems: 'center', gap: S.xs },
  metricValue: { fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
  metricLabel: { color: C.text2, textAlign: 'center' },
  metricDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: S.sm,
    backgroundColor: C.borderMd,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: S.base,
  },
});
