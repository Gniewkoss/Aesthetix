import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { GradientButton } from '../../components/ui/GradientButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { InfoRow } from '../../components/common/InfoRow';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SW } = Dimensions.get('window');

type FeatureItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
};

const FEATURES: FeatureItem[] = [
  { icon: 'scan-outline', label: 'AI Scan', description: 'Full physique analysis in 60 seconds' },
  { icon: 'analytics-outline', label: '11 Muscles', description: 'Detailed breakdown of every muscle group' },
  { icon: 'trending-up-outline', label: 'Progress', description: 'Track scores and improvements over time' },
];

export function OnboardingScreen(_props: Props) {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  // Brand mark breathes — very slow, very subtle
  const markScale   = useSharedValue(1.0);
  const markOpacity = useSharedValue(0.92);
  // Cream glow behind mark
  const glowOpacity = useSharedValue(0.25);

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    markScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 3500, easing: ease }),
        withTiming(0.98, { duration: 3500, easing: ease }),
      ),
      -1, false,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 3500, easing: ease }),
        withTiming(0.18, { duration: 3500, easing: ease }),
      ),
      -1, false,
    );
  }, []);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.root}>

      {/* Diagonal brand gradient — 135° direction matches mark's blade angle */}
      {/* bottom-left → top-right, like the mark sweeps */}
      <LinearGradient
        colors={['rgba(236,236,230,0.08)', 'rgba(236,236,230,0.02)', 'transparent']}
        start={{ x: 0.0, y: 1.0 }}
        end={{ x: 0.8, y: 0.1 }}
        style={styles.diagonalGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe}>

        {/* ── Top brand row ─────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.brandRow}>
          <AesthetixLogo variant="wordmark" width={128} color={COLORS.cream} />
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </Animated.View>

        {/* ── Hero — mark + headline ─────────────────────────── */}
        <View style={styles.hero}>

          {/* Raw cream mark — no container, no rings */}
          {/* The mark sits on pure black — exactly like the logo SVG */}
          <Animated.View entering={FadeIn.delay(200).duration(900)} style={styles.markWrap}>
            {/* Cream ambient glow — single, restrained */}
            <Animated.View style={[styles.markGlow, glowStyle]} />
            {/* The mark itself in brand cream */}
            <Animated.View style={markStyle}>
              <AesthetixLogo
                variant="mark"
                width={120}
                height={120}
                color={COLORS.cream}
              />
            </Animated.View>
          </Animated.View>

          {/* Headline block — left-aligned, editorial */}
          <View style={styles.headlineBlock}>
            <Animated.Text
              entering={FadeInDown.delay(460).duration(700)}
              style={styles.headlineLine1}
            >
              Your physique,
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(600).duration(700)}
              style={styles.headlineLine2}
            >
              analyzed by AI.
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(900).duration(600)}
              style={styles.subtitle}
            >
              Upload 3 photos. Get a complete breakdown of{'\n'}11 muscle groups in under 60 seconds.
            </Animated.Text>
          </View>

        </View>

        {/* ── Divider — brand precision line ─────────────────── */}
        <Animated.View
          entering={FadeIn.delay(1000).duration(500)}
          style={styles.divider}
        />

        {/* ── Feature list — shadcn grouped card ─────────────── */}
        <Animated.View entering={FadeInUp.delay(1060).duration(500)} style={styles.featuresBlock}>
          <GlassCard padding={0}>
            {FEATURES.map((f, i) => (
              <InfoRow
                key={f.label}
                title={f.label}
                subtitle={f.description}
                showBorder={i < FEATURES.length - 1}
                leftContent={
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon} size={16} color={COLORS.accent} />
                  </View>
                }
              />
            ))}
          </GlassCard>
        </Animated.View>

        {/* ── CTA ────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(1200).duration(500)}
          style={styles.ctaBlock}
        >
          {/* Brand-variant button — cream, the logo's own color */}
          <GradientButton
            title="Start my first scan"
            onPress={completeOnboarding}
            size="lg"
            variant="brand"
            style={styles.ctaBtn}
            trailingIcon={<Ionicons name="arrow-forward" size={15} color="#060609" />}
          />
          <Text style={styles.trustLine}>Free to try · No credit card needed</Text>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  // Diagonal sweep — matches 135° blade geometry of the mark
  diagonalGlow: {
    position: 'absolute',
    bottom: -SW * 0.2,
    left: -SW * 0.1,
    width: SW * 1.2,
    height: SW * 1.5,
  },

  safe: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xl,
  },

  // ── Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  aiBadge: {
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    backgroundColor: COLORS.creamDim,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  aiBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
    letterSpacing: 1.4,
  },

  // ── Hero
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING['2xl'],
  },

  // ── Mark — raw, no container
  markWrap: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  markGlow: {
    position: 'absolute',
    top: -24,
    left: -24,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: COLORS.cream,
    // RN doesn't have CSS blur, but the opacity fade simulates ambient glow
    // Use a large blur-like effect via multiple positioned views if needed
  },

  // ── Headline — left-aligned, editorial, brand-tight tracking
  headlineBlock: {
    gap: 0,
  },
  headlineLine1: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['4xl'] * FONTS.lineHeights.tight,
  },
  headlineLine2: {
    // The accent line is in CREAM — the logo's own color
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.cream,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['4xl'] * FONTS.lineHeights.tight,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    lineHeight: FONTS.sizes.sm * FONTS.lineHeights.relaxed,
  },

  // ── Divider — single hairline, precision edge
  divider: {
    height: 1,
    backgroundColor: COLORS.border.hairline,
    marginBottom: SPACING.xl,
  },

  featuresBlock: {
    marginBottom: SPACING.xl,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── CTA
  ctaBlock: {
    gap: SPACING.md,
    alignItems: 'center',
  },
  ctaBtn: { width: '100%' },
  trustLine: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    letterSpacing: 0.3,
  },
});
