import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PhysiqueAnalysis } from '../../../types';
import { C, T, R, S, LAYOUT, E, BTN_LABEL, scoreColor, scoreTier } from '../../../theme/obsidian';
import { VoltRing } from './VoltRing';
import { AnimatedCount } from './AnimatedCount';
import { PressableScale } from './PressableScale';

interface ScoreHeroProps {
  analysis: PhysiqueAnalysis | null;
  reduceMotion: boolean;
  onViewReport: () => void;
  onNewScan: () => void;
  onStartScan: () => void;
}

// ─── Active state: latest score ───────────────────────────────────────────────
function ActiveHero({ analysis, reduceMotion, onViewReport, onNewScan }: {
  analysis: PhysiqueAnalysis;
  reduceMotion: boolean;
  onViewReport: () => void;
  onNewScan: () => void;
}) {
  const col = scoreColor(analysis.overallScore);
  const tier = scoreTier(analysis.overallScore);
  const date = new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const bf = analysis.bodyFatRange ?? `${analysis.bodyFat}%`;

  const meta = [
    { icon: 'calendar-outline' as const, label: date },
    { icon: 'body-outline' as const, label: `BF ${bf}` },
    { icon: 'resize-outline' as const, label: `V-Taper ${analysis.vTaperScore}` },
  ];

  return (
    <PressableScale
      scaleTo={0.99}
      onPress={onViewReport}
      accessibilityLabel={`Physique score ${analysis.overallScore}, ${tier}. View full report.`}
      style={[styles.card, { borderColor: col + '33' }]}
    >
      <LinearGradient
        colors={[col + '14', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.8 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.eyebrow}>PHYSIQUE SCORE</Text>
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

        <VoltRing score={analysis.overallScore} size={92} strokeWidth={7} color={col} instant={reduceMotion}>
          <Ionicons name="flash" size={20} color={col} />
        </VoltRing>
      </View>

      {/* Meta chips */}
      <View style={styles.metaRow}>
        {meta.map((m, i) => (
          <React.Fragment key={m.label}>
            {i > 0 && <View style={styles.metaDot} />}
            <View style={styles.metaChip}>
              <Ionicons name={m.icon} size={11} color={C.text3} />
              <Text style={[T.caption, { color: C.text3 }]}>{m.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Footer actions */}
      <View style={styles.footer}>
        <View style={styles.action}>
          <Text style={[T.label, { color: C.text }]}>View full report</Text>
          <Ionicons name="arrow-forward" size={13} color={C.text} />
        </View>
        <View style={{ flex: 1 }} />
        <PressableScale
          onPress={onNewScan}
          hitSlop={12}
          accessibilityLabel="Start a new scan"
          style={styles.newScan}
        >
          <Ionicons name="add" size={14} color={C.voltInk} />
          <Text style={[BTN_LABEL, { color: C.voltInk, fontSize: 13, lineHeight: 16 }]}>New scan</Text>
        </PressableScale>
      </View>
    </PressableScale>
  );
}

// ─── Empty state: first-run hero ──────────────────────────────────────────────
function EmptyHero({ onStartScan }: { onStartScan: () => void }) {
  return (
    <View style={[styles.card, { borderColor: C.voltBorder }]}>
      <LinearGradient
        colors={[C.voltDim, 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.9 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.eyebrow, { color: C.volt }]}>AESTHETIX AI</Text>
          <Text style={[T.title, { color: C.text, marginTop: S.sm }]}>Discover your{'\n'}true physique</Text>
          <Text style={[T.bodySm, { color: C.text2, marginTop: S.sm }]}>
            AI analysis in 60 seconds — score, muscle breakdown, and a plan.
          </Text>
        </View>
        <VoltRing score={0} size={92} strokeWidth={7} instant>
          <Ionicons name="scan-outline" size={22} color={C.volt} />
        </VoltRing>
      </View>

      <PressableScale
        onPress={onStartScan}
        accessibilityLabel="Start AI scan"
        style={[styles.cta, E.glow]}
      >
        <Text style={[BTN_LABEL, { color: C.voltInk }]}>Start AI scan</Text>
        <Ionicons name="arrow-forward" size={16} color={C.voltInk} />
      </PressableScale>
      <Text style={[T.caption, { color: C.text3, textAlign: 'center', marginTop: S.md }]}>
        Front + side photos · Free to try
      </Text>
    </View>
  );
}

export function ScoreHero(props: ScoreHeroProps) {
  if (props.analysis) {
    return (
      <ActiveHero
        analysis={props.analysis}
        reduceMotion={props.reduceMotion}
        onViewReport={props.onViewReport}
        onNewScan={props.onNewScan}
      />
    );
  }
  return <EmptyHero onStartScan={props.onStartScan} />;
}

const styles = StyleSheet.create({
  card: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: S.base,
  },
  left: { flex: 1, minWidth: 0 },
  eyebrow: { ...T.overline, color: C.text3 },
  scoreWrap: {
    alignSelf: 'flex-start',
    marginTop: S.lg,
    marginBottom: 0,
  },
  scoreNum: {
    height: 60,
    lineHeight: 60,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    textAlign: 'left',
  },
  tierPill: {
    alignSelf: 'flex-start',
    marginTop: -S.xs,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: R.pill,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: LAYOUT.cardPad,
  },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textDis },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: LAYOUT.cardPad,
    paddingTop: S.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newScan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.volt,
    paddingHorizontal: S.md,
    paddingVertical: 8,
    borderRadius: R.pill,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    height: 52,
    borderRadius: R.md,
    backgroundColor: C.volt,
    marginTop: LAYOUT.cardPad,
  },
});
