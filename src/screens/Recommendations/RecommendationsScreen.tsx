import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { RecommendationCard } from '../../components/analysis/RecommendationCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING, getScoreColor, getScoreLabel } from '../../theme';
import { MOCK_ANALYSIS } from '../../api/mock';

export function RecommendationsScreen() {
  const { currentAnalysis, loadHistory, history } = useAnalysisStore();

  useEffect(() => {
    if (!currentAnalysis && history.length === 0) loadHistory();
  }, []);

  const analysis = currentAnalysis ?? (history.length > 0 ? history[history.length - 1] : MOCK_ANALYSIS);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Coach</Text>
          <Text style={styles.subtitle}>Personalized physique improvement plan</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Score brief */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.scoreBrief}>
            <View style={styles.scoreBriefLeft}>
              <Text style={[styles.scoreBriefNumber, { color: getScoreColor(analysis.overallScore) }]}>
                {analysis.overallScore}
              </Text>
              <View style={[styles.scoreLabelBadge, { backgroundColor: `${getScoreColor(analysis.overallScore)}18`, borderColor: `${getScoreColor(analysis.overallScore)}30` }]}>
                <Text style={[styles.scoreLabelText, { color: getScoreColor(analysis.overallScore) }]}>
                  {getScoreLabel(analysis.overallScore)}
                </Text>
              </View>
            </View>
            <View style={styles.scoreBriefRight}>
              <View style={styles.scoreBriefStat}>
                <Text style={styles.scoreBriefStatLabel}>BODY FAT</Text>
                <Text style={styles.scoreBriefStatValue}>{analysis.bodyFatRange ?? `${analysis.bodyFat}%`}</Text>
              </View>
              <View style={styles.scoreBriefDivider} />
              <View style={styles.scoreBriefStat}>
                <Text style={styles.scoreBriefStatLabel}>POTENTIAL</Text>
                <Text style={styles.scoreBriefStatValue}>{analysis.predictedPotentialScore}</Text>
              </View>
              <View style={styles.scoreBriefDivider} />
              <View style={styles.scoreBriefStat}>
                <Text style={styles.scoreBriefStatLabel}>PRIORITY</Text>
                <Text style={styles.scoreBriefStatValue} numberOfLines={1}>
                  {analysis.improvementPlan[0]?.area ?? '—'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Improvement Plan */}
          <Animated.View entering={FadeInDown.duration(350)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="trophy-outline" size={14} color={COLORS.accent} />
              </View>
              <Text style={styles.sectionTitle}>Improvement Plan</Text>
            </View>
            {analysis.improvementPlan.map((item) => (
              <RecommendationCard key={item.priority} item={item} />
            ))}
          </Animated.View>

          {/* Dietary Recommendations */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenBorder }]}>
                <Ionicons name="nutrition-outline" size={14} color={COLORS.green} />
              </View>
              <Text style={styles.sectionTitle}>Nutrition Protocol</Text>
            </View>
            {analysis.dietaryRecommendations.map((rec, i) => (
              <View key={i} style={styles.dietCard}>
                <View style={styles.dietBadge}>
                  <Text style={styles.dietBadgeText}>{rec.category}</Text>
                </View>
                <Text style={styles.dietRec}>{rec.recommendation}</Text>
                <Text style={styles.dietRationale}>{rec.rationale}</Text>
              </View>
            ))}
          </Animated.View>

          {/* AI Chat Teaser */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <GlassCard style={styles.aiChatCard}>
              <View style={styles.aiChatHeader}>
                <View style={styles.aiChatIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={18} color={COLORS.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiChatTitle}>AI Coach Chat</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.aiChatText}>
                Ask your AI coach anything about training, nutrition, or your physique goals.
              </Text>

              {/* Mock chat preview */}
              <View style={styles.chatPreview}>
                <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                  <Text style={styles.chatText}>
                    Based on your analysis, prioritize legs 2× per week. Your upper body is solid — the quad sweep gap is holding your overall score back.
                  </Text>
                </View>
                <View style={[styles.chatBubble, styles.chatBubbleUser]}>
                  <Text style={[styles.chatText, { color: '#fff' }]}>
                    What's the best program for V-taper?
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.base, paddingBottom: SPACING.xl },
  title: { fontSize: FONTS.sizes['3xl'], fontFamily: FONT_FAMILY.display, color: COLORS.text.primary, letterSpacing: TRACKING.display },
  subtitle: { fontSize: FONTS.sizes.sm, fontFamily: FONT_FAMILY.body, color: COLORS.text.muted, marginTop: 2 },
  scroll: { paddingHorizontal: SPACING.lg },

  scoreBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    gap: SPACING.base,
  },
  scoreBriefLeft: {
    alignItems: 'center',
    gap: 6,
    paddingRight: SPACING.base,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  scoreBriefNumber: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['4xl'],
  },
  scoreLabelBadge: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  scoreLabelText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
  },
  scoreBriefRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreBriefStat: { flex: 1, alignItems: 'center', gap: 4 },
  scoreBriefStatLabel: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.caps,
  },
  scoreBriefStatValue: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  scoreBriefDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xl,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.heading,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.label,
  },

  dietCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: 10,
  },
  dietBadge: {
    backgroundColor: COLORS.greenDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: SPACING.sm,
  },
  dietBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
  },
  dietRec: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    marginBottom: SPACING.sm,
  },
  dietRationale: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.65,
  },

  aiChatCard: { marginBottom: 10, marginTop: SPACING.xl },
  aiChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  aiChatIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.purpleDim,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChatTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    marginBottom: 4,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.purpleDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  comingSoonText: {
    color: COLORS.purple,
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
  },
  aiChatText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    marginBottom: SPACING.base,
    lineHeight: FONTS.sizes.sm * 1.6,
  },
  chatPreview: { gap: SPACING.sm },
  chatBubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    maxWidth: '88%',
  },
  chatBubbleAI: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignSelf: 'flex-start',
  },
  chatBubbleUser: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-end',
  },
  chatText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.55,
  },
});
