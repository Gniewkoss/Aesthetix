import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { PageHeader } from '../../components/common/PageHeader';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING, getScoreColor } from '../../theme';
import { MUSCLE_GROUP_META } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'MuscleDetail'>;

interface SectionCardProps {
  accentColor: string;
  iconName: string;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ accentColor, iconName, title, children }: SectionCardProps) {
  return (
    <View style={[styles.card, { borderColor: accentColor + '18' }]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconWrap, { backgroundColor: accentColor + '10', borderColor: accentColor + '25' }]}>
            <Ionicons name={iconName as any} size={12} color={accentColor} />
          </View>
          <Text style={[styles.cardTitle, { color: accentColor }]}>{title}</Text>
        </View>
        {children}
      </View>
    </View>
  );
}

export function MuscleDetailScreen({ navigation, route }: Props) {
  const { muscleKey, analysis } = route.params;
  const meta = MUSCLE_GROUP_META[muscleKey];
  const color = getScoreColor(analysis.score);
  const hasDetails =
    analysis.strengths.length > 0 ||
    analysis.weaknesses.length > 0 ||
    analysis.recommendations.length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader
          variant="push"
          title={meta.label}
          subtitle={meta.bodyPart}
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero — ring only, no redundant icon above it */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.hero}>
            <CircularProgress score={analysis.score} size={150} strokeWidth={11} color={color} />
            <Text style={styles.heroLabel}>{meta.label} Score</Text>
          </Animated.View>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.cardWrap}>
              <SectionCard accentColor={COLORS.green} iconName="checkmark" title="Strengths">
                {analysis.strengths.map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: COLORS.green }]} />
                    <Text style={styles.bulletText}>{s}</Text>
                  </View>
                ))}
              </SectionCard>
            </Animated.View>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <Animated.View entering={FadeInDown.delay(130).duration(350)} style={styles.cardWrap}>
              <SectionCard accentColor={COLORS.amber} iconName="alert" title="Weaknesses">
                {analysis.weaknesses.map((w, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: COLORS.amber }]} />
                    <Text style={styles.bulletText}>{w}</Text>
                  </View>
                ))}
              </SectionCard>
            </Animated.View>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.cardWrap}>
              <SectionCard accentColor={COLORS.accent} iconName="flash" title="Recommendations">
                {analysis.recommendations.map((r, i) => (
                  <View key={i} style={styles.recRow}>
                    <View style={styles.recNum}>
                      <Text style={styles.recNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.recText}>{r}</Text>
                  </View>
                ))}
              </SectionCard>
            </Animated.View>
          )}

          {!hasDetails && (
            <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.emptyCard}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.text.muted} />
              <Text style={styles.emptyText}>
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
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING['3xl'] },

  hero: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    gap: SPACING.md,
  },
  heroLabel: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
  },

  cardWrap: { marginBottom: LAYOUT.cardGap },
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: { width: 3, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: SPACING.base },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardIconWrap: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  bullet: { width: 5, height: 5, borderRadius: 2.5, marginTop: 7, flexShrink: 0 },
  bulletText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
    lineHeight: FONTS.sizes.sm * 1.65,
  },

  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  recNum: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    flexShrink: 0,
  },
  recNumText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  recText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
    lineHeight: FONTS.sizes.sm * FONTS.lineHeights.relaxed,
  },

  emptyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    marginTop: SPACING.sm,
  },
  emptyText: {
    flex: 1,
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * FONTS.lineHeights.relaxed,
  },
});
