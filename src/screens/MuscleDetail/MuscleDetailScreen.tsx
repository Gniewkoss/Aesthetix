import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';
import { MUSCLE_GROUP_META } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'MuscleDetail'>;

export function MuscleDetailScreen({ navigation, route }: Props) {
  const { muscleKey, analysis } = route.params;
  const meta = MUSCLE_GROUP_META[muscleKey];
  const color = getScoreColor(analysis.score);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          title={meta.label}
          subtitle={meta.bodyPart}
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.hero}>
            <View style={[styles.iconWrap, { backgroundColor: color + '12', borderColor: color + '25' }]}>
              <Ionicons name={meta.icon as any} size={36} color={color} />
            </View>
            <CircularProgress score={analysis.score} size={150} strokeWidth={11} color={color} />
            <Text style={styles.label}>{meta.label} Score</Text>
          </Animated.View>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Animated.View entering={FadeInDown.delay(80).duration(350)}>
              <GlassCard style={styles.section} neonColor={COLORS.green}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenBorder }]}>
                    <Ionicons name="checkmark" size={12} color={COLORS.green} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: COLORS.green }]}>Strengths</Text>
                </View>
                {analysis.strengths.map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: COLORS.green }]} />
                    <Text style={styles.bulletText}>{s}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <Animated.View entering={FadeInDown.delay(130).duration(350)}>
              <GlassCard style={styles.section} neonColor={COLORS.amber}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: COLORS.amberDim, borderColor: COLORS.amberBorder }]}>
                    <Ionicons name="alert" size={12} color={COLORS.amber} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: COLORS.amber }]}>Weaknesses</Text>
                </View>
                {analysis.weaknesses.map((w, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: COLORS.amber }]} />
                    <Text style={styles.bulletText}>{w}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).duration(350)}>
              <GlassCard style={styles.section} neonColor={COLORS.accent}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: COLORS.accentDim, borderColor: COLORS.accentBorder }]}>
                    <Ionicons name="flash" size={12} color={COLORS.accent} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: COLORS.accent }]}>Recommendations</Text>
                </View>
                {analysis.recommendations.map((r, i) => (
                  <View key={i} style={styles.recRow}>
                    <View style={styles.recNum}>
                      <Text style={styles.recNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.recText}>{r}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.base },

  hero: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    gap: SPACING.lg,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  section: {
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
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
    borderRadius: 6,
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
    lineHeight: FONTS.sizes.sm * 1.65,
  },
});
