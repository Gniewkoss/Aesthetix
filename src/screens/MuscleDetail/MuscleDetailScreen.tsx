import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { COLORS, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';
import { MUSCLE_GROUP_META } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'MuscleDetail'>;

export function MuscleDetailScreen({ navigation, route }: Props) {
  const { muscleKey, analysis } = route.params;
  const meta = MUSCLE_GROUP_META[muscleKey];
  const color = getScoreColor(analysis.score);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[color + '18', 'transparent']} style={styles.heroBg} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          title={meta.label}
          subtitle={meta.bodyPart}
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <Text style={styles.emoji}>{meta.emoji}</Text>
            <CircularProgress score={analysis.score} size={160} strokeWidth={12} color={color} />
            <Text style={styles.label}>{meta.label} Score</Text>
          </Animated.View>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <GlassCard style={styles.section} neonColor={COLORS.green}>
                <Text style={[styles.sectionTitle, { color: COLORS.green }]}>✅ Strengths</Text>
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
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <GlassCard style={styles.section} neonColor={COLORS.pink}>
                <Text style={[styles.sectionTitle, { color: COLORS.pink }]}>⚠️ Weaknesses</Text>
                {analysis.weaknesses.map((w, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: COLORS.pink }]} />
                    <Text style={styles.bulletText}>{w}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <LinearGradient
                colors={['rgba(0,245,255,0.07)', 'rgba(123,47,190,0.04)']}
                style={[styles.section, styles.recsCard]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.sectionTitle, { color: COLORS.cyan }]}>🎯 Recommendations</Text>
                {analysis.recommendations.map((r, i) => (
                  <View key={i} style={styles.recRow}>
                    <View style={styles.recNum}>
                      <Text style={styles.recNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.recText}>{r}</Text>
                  </View>
                ))}
              </LinearGradient>
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
  heroBg: { position: 'absolute', width: '100%', height: 300, top: 0 },
  scroll: { paddingHorizontal: SPACING.base },
  hero: { alignItems: 'center', paddingVertical: SPACING['2xl'], gap: SPACING.md },
  emoji: { fontSize: 48 },
  label: { color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  section: {
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  recsCard: { borderColor: 'rgba(0,245,255,0.15)' },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.md,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletText: { color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, flex: 1, lineHeight: FONTS.sizes.sm * 1.6 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.md },
  recNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.cyanDim, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cyanBorder,
  },
  recNumText: { color: COLORS.cyan, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.black },
  recText: { color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, flex: 1, lineHeight: FONTS.sizes.sm * 1.6 },
});
