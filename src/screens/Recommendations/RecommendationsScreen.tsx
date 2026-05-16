import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { RecommendationCard } from '../../components/analysis/RecommendationCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import { MOCK_ANALYSIS } from '../../api/mock';

export function RecommendationsScreen() {
  const { currentAnalysis, loadHistory, history } = useAnalysisStore();

  useEffect(() => {
    if (!currentAnalysis && history.length === 0) loadHistory();
  }, []);

  const analysis = currentAnalysis ?? (history.length > 0 ? history[history.length - 1] : MOCK_ANALYSIS);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['rgba(0,245,255,0.08)', 'transparent']} style={styles.orb} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Coach</Text>
          <Text style={styles.subtitle}>Personalized physique improvement plan</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Improvement Plan */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.sectionTitle}>🎯 Improvement Plan</Text>
            {analysis.improvementPlan.map((item) => (
              <RecommendationCard key={item.priority} item={item} />
            ))}
          </Animated.View>

          {/* Dietary Recommendations */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={styles.sectionTitle}>🥗 Nutrition Protocol</Text>
            {analysis.dietaryRecommendations.map((rec, i) => (
              <LinearGradient
                key={i}
                colors={['rgba(6,255,165,0.06)', 'rgba(0,245,255,0.03)']}
                style={styles.dietCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.dietHeader}>
                  <View style={styles.dietBadge}>
                    <Text style={styles.dietBadgeText}>{rec.category}</Text>
                  </View>
                </View>
                <Text style={styles.dietRec}>{rec.recommendation}</Text>
                <Text style={styles.dietRationale}>{rec.rationale}</Text>
              </LinearGradient>
            ))}
          </Animated.View>

          {/* AI Chat Teaser */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <LinearGradient
              colors={['rgba(123,47,190,0.15)', 'rgba(0,245,255,0.08)']}
              style={styles.aiChatCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.aiChatIcon}>🤖</Text>
              <Text style={styles.aiChatTitle}>AI Coach Chat</Text>
              <Text style={styles.aiChatText}>
                Ask your AI coach anything about your physique, training split, nutrition, or supplement stack.
              </Text>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>COMING SOON • PREMIUM</Text>
              </View>

              {/* Mock chat preview */}
              <View style={styles.chatPreview}>
                <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                  <Text style={styles.chatText}>
                    Based on your analysis, I recommend prioritizing legs 2x per week. Your upper body is solid, but the quad sweep gap is holding your overall score back significantly. 🦵
                  </Text>
                </View>
                <View style={[styles.chatBubble, styles.chatBubbleUser]}>
                  <Text style={[styles.chatText, { color: '#000' }]}>
                    What's the best program for V-taper?
                  </Text>
                </View>
                <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                  <Text style={styles.chatText}>
                    For V-taper: wide-grip pull-ups, cable lat pulldowns, and overhead press. Aim for shoulder-to-waist ratio of 1.618 (golden ratio). Your current ratio: ~1.4. Target: 1.6+
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, top: -100, right: -100 },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING['2xl'], marginBottom: SPACING.base },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 2 },
  scroll: { paddingHorizontal: SPACING.base },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    marginTop: SPACING.base,
  },
  dietCard: {
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(6,255,165,0.15)',
    padding: SPACING.base, marginBottom: SPACING.md,
  },
  dietHeader: { marginBottom: SPACING.sm },
  dietBadge: {
    backgroundColor: COLORS.greenDim, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 3, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.greenBorder,
  },
  dietBadgeText: { color: COLORS.green, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  dietRec: { color: COLORS.text.primary, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, marginBottom: SPACING.sm },
  dietRationale: { color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, lineHeight: FONTS.sizes.sm * 1.6 },
  aiChatCard: {
    borderRadius: RADIUS['2xl'], borderWidth: 1, borderColor: 'rgba(123,47,190,0.3)',
    padding: SPACING.base, marginBottom: SPACING.base,
  },
  aiChatIcon: { fontSize: 32, marginBottom: SPACING.sm },
  aiChatTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.text.primary, marginBottom: SPACING.xs },
  aiChatText: { color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.base, lineHeight: FONTS.sizes.sm * 1.5 },
  comingSoon: {
    backgroundColor: COLORS.purpleDim, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.purpleBorder,
    paddingHorizontal: SPACING.md, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: SPACING.xl,
  },
  comingSoonText: { color: COLORS.purple, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.black, letterSpacing: 1.5 },
  chatPreview: { gap: SPACING.sm },
  chatBubble: {
    borderRadius: RADIUS.lg, padding: SPACING.md, maxWidth: '90%',
  },
  chatBubbleAI: {
    backgroundColor: 'rgba(0,245,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,245,255,0.2)',
    alignSelf: 'flex-start',
  },
  chatBubbleUser: {
    backgroundColor: COLORS.cyan, alignSelf: 'flex-end',
  },
  chatText: { color: COLORS.text.primary, fontSize: FONTS.sizes.sm, lineHeight: FONTS.sizes.sm * 1.5 },
});
