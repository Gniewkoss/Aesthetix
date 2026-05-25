import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { GradientButton } from '../../components/ui/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

type FeatureItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
};

const FEATURES: FeatureItem[] = [
  { icon: 'scan-outline',        label: 'AI Scan',     color: COLORS.accent  },
  { icon: 'analytics-outline',   label: '11 Muscles',  color: '#8B5CF6'      },
  { icon: 'trending-up-outline', label: 'Progress',    color: COLORS.green   },
];

export function OnboardingScreen(_props: Props) {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const handleStart = () => {
    // RootNavigator switches to MainTabs when onboardingCompleted becomes true
    completeOnboarding();
  };

  return (
    <View style={styles.root}>
      {/* Subtle top glow — doesn't touch content */}
      <LinearGradient
        colors={['rgba(59,130,246,0.12)', 'transparent']}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe}>
        {/* ── Brand wordmark ─────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(700)} style={styles.wordmarkRow}>
          <AesthetixLogo variant="wordmark" width={168} />
          <View style={styles.wordmarkBadge}>
            <Text style={styles.wordmarkBadgeText}>AI</Text>
          </View>
        </Animated.View>

        {/* ── Main headline ───────────────────────────────────────── */}
        <View style={styles.hero}>
          <Animated.Text entering={FadeInDown.delay(280).duration(600)} style={styles.headline}>
            Your physique,
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.headlineAccent}>
            analyzed by AI.
          </Animated.Text>

          <Animated.Text entering={FadeIn.delay(650).duration(600)} style={styles.subtitle}>
            Upload 3 photos. Get a complete breakdown of{'\n'}11 muscle groups in under 60 seconds.
          </Animated.Text>
        </View>

        {/* ── Feature chips ───────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(900).duration(500)} style={styles.chips}>
          {FEATURES.map((f) => (
            <View key={f.label} style={[styles.chip, { borderColor: f.color + '28' }]}>
              <Ionicons name={f.icon} size={14} color={f.color} />
              <Text style={[styles.chipLabel, { color: f.color }]}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(1100).duration(500)} style={styles.ctaBlock}>
          <GradientButton
            title="Start my first scan"
            onPress={handleStart}
            size="lg"
            style={styles.ctaBtn}
            icon={<Ionicons name="arrow-forward" size={16} color="#fff" />}
          />
          <Text style={styles.trust}>Free to try · No credit card needed</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  safe: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },

  // ── Wordmark
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  wordmarkBadge: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  wordmarkBadgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1,
  },

  // ── Hero
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: SPACING['2xl'],
  },
  headline: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    lineHeight: FONTS.sizes['4xl'] * 1.05,
  },
  headlineAccent: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.accent,
    letterSpacing: 0.5,
    lineHeight: FONTS.sizes['4xl'] * 1.05,
    marginBottom: SPACING['2xl'],
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.base * 1.65,
  },

  // ── Feature chips
  chips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING['3xl'],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: COLORS.glass.bg,
  },
  chipLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: 0.2,
  },

  // ── CTA block
  ctaBlock: {
    gap: SPACING.md,
    alignItems: 'center',
  },
  ctaBtn: {
    width: '100%',
  },
  trust: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    letterSpacing: 0.3,
  },
});
