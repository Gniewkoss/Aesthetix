import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { MUSCLE_GROUP_META } from '../../constants';
import { C, T, R, S, LAYOUT, E, scoreColor, scoreTier } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { VoltRing } from '../Dashboard/home/VoltRing';
import { RingScore, opticalNudgeY } from '../Dashboard/home/RingScore';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

type Props = NativeStackScreenProps<RootStackParamList, 'MuscleDetail'>;

function SectionCard({ accent, icon, title, children }: {
  accent: string; icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: accent + '1A', borderColor: accent + '38' }]}>
          <Ionicons name={icon} size={14} color={accent} />
        </View>
        <Text style={[T.cardTitle, { color: C.text, fontSize: 16 }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function MuscleDetailScreen({ navigation, route }: Props) {
  const reduceMotion = useReducedMotion();
  const { muscleKey, analysis } = route.params;
  const meta = MUSCLE_GROUP_META[muscleKey];
  const col = scoreColor(analysis.score);
  const tier = scoreTier(analysis.score);
  const hasDetails =
    analysis.strengths.length > 0 || analysis.weaknesses.length > 0 || analysis.recommendations.length > 0;

  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title={meta.label} subtitle={meta.bodyPart} onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero ring */}
          <Animated.View entering={enter(0)} style={styles.hero}>
            <VoltRing score={analysis.score} size={150} strokeWidth={11} color={col} instant={reduceMotion}>
              <RingScore value={analysis.score} color={col} fontSize={48} instant={reduceMotion} />
            </VoltRing>
            <View style={[styles.tierPill, { backgroundColor: col + '1A', borderColor: col + '40' }]}>
              <Text style={[T.overline, { color: col }]}>{tier.toUpperCase()}</Text>
            </View>
            <Text style={[T.caption, { color: C.text3, marginTop: S.sm }]}>{meta.label.toUpperCase()} SCORE</Text>
          </Animated.View>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Animated.View entering={enter(1)} style={styles.cardWrap}>
              <SectionCard accent={C.success} icon="checkmark-circle-outline" title="Strengths">
                {analysis.strengths.map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: C.success }]} />
                    <Text style={[T.bodySm, styles.bulletText]}>{s}</Text>
                  </View>
                ))}
              </SectionCard>
            </Animated.View>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <Animated.View entering={enter(2)} style={styles.cardWrap}>
              <SectionCard accent={C.warning} icon="alert-circle-outline" title="Weaknesses">
                {analysis.weaknesses.map((w, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: C.warning }]} />
                    <Text style={[T.bodySm, styles.bulletText]}>{w}</Text>
                  </View>
                ))}
              </SectionCard>
            </Animated.View>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Animated.View entering={enter(3)} style={styles.cardWrap}>
              <SectionCard accent={C.volt} icon="flash" title="Recommendations">
                {analysis.recommendations.map((r, i) => (
                  <View key={i} style={styles.recRow}>
                    <View style={styles.recNum}>
                      <Text style={styles.recNumLabel}>{i + 1}</Text>
                    </View>
                    <Text style={[T.bodySm, styles.recText]}>{r}</Text>
                  </View>
                ))}
              </SectionCard>
            </Animated.View>
          )}

          {!hasDetails && (
            <Animated.View entering={enter(1)} style={styles.emptyCard}>
              <Ionicons name="information-circle-outline" size={20} color={C.text3} />
              <Text style={[T.bodySm, { color: C.text2, flex: 1, lineHeight: 21 }]}>
                No detailed breakdown is available for this muscle group in this scan. Run another scan for richer insights.
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },

  hero: { alignItems: 'center', paddingVertical: S['2xl'], gap: S.md },
  tierPill: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.pill, borderWidth: 1 },

  cardWrap: { marginBottom: LAYOUT.cardGap },
  card: { ...E.card, borderRadius: R.xl, padding: LAYOUT.cardPad },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
  cardIcon: { width: 28, height: 28, borderRadius: R.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.sm },
  bullet: { width: 5, height: 5, borderRadius: 2.5, marginTop: 8, flexShrink: 0 },
  bulletText: { color: C.text2, flex: 1, lineHeight: 22 },

  recRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.md },
  recNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recNumLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 13,
    color: C.volt,
    textAlign: 'center',
    includeFontPadding: false,
    transform: [{ translateY: opticalNudgeY(13) }],
  },
  recText: { color: C.text2, flex: 1, lineHeight: 22 },

  emptyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.md,
    ...E.card, borderRadius: R.xl, padding: LAYOUT.cardPad, marginTop: S.sm,
  },
});
