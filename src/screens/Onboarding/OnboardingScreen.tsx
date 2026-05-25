import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

type FeatureItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
};

const FEATURES: FeatureItem[] = [
  { icon: 'scan-outline',        label: 'AI Scan',    color: COLORS.accent  },
  { icon: 'analytics-outline',   label: '11 Muscles', color: '#8B5CF6'      },
  { icon: 'trending-up-outline', label: 'Progress',   color: COLORS.green   },
];

export function OnboardingScreen(_props: Props) {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  // Layered pulse: outer ring breathes slower, inner breathes faster
  const outerScale   = useSharedValue(0.92);
  const outerOpacity = useSharedValue(0.30);
  const innerScale   = useSharedValue(1.0);

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);

    outerScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 2600, easing: ease }),
        withTiming(0.92, { duration: 2600, easing: ease }),
      ),
      -1, false,
    );
    outerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.62, { duration: 2600, easing: ease }),
        withTiming(0.22, { duration: 2600, easing: ease }),
      ),
      -1, false,
    );
    innerScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3200, easing: ease }),
        withTiming(0.96, { duration: 3200, easing: ease }),
      ),
      -1, false,
    );
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    opacity: outerOpacity.value,
  }));

  const innerBoxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Ambient radial glow behind hero */}
      <LinearGradient
        colors={['rgba(59,130,246,0.16)', 'rgba(59,130,246,0.04)', 'transparent']}
        style={styles.bgGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe}>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <View style={styles.hero}>

          {/* Layered glow rings around mark */}
          <Animated.View entering={FadeIn.duration(1000)} style={styles.markWrapper}>
            {/* Outer pulsing ring */}
            <Animated.View style={[styles.outerRing, outerRingStyle]} />
            {/* Static middle ring */}
            <View style={styles.middleRing} />
            {/* Inner mark container with subtle breathe */}
            <Animated.View style={[styles.markBox, innerBoxStyle]}>
              <AesthetixLogo variant="mark" width={68} height={68} />
            </Animated.View>
          </Animated.View>

          {/* Wordmark + AI badge */}
          <Animated.View
            entering={FadeIn.delay(320).duration(700)}
            style={styles.wordmarkRow}
          >
            <AesthetixLogo variant="wordmark" width={148} />
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </Animated.View>

          {/* Headline block */}
          <View style={styles.headlineBlock}>
            <Animated.Text
              entering={FadeInDown.delay(580).duration(700)}
              style={styles.headline}
            >
              Your physique,
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(740).duration(700)}
              style={styles.headlineAccent}
            >
              analyzed by AI.
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(1020).duration(600)}
              style={styles.subtitle}
            >
              Upload 3 photos. Get a complete breakdown{'\n'}of 11 muscle groups in 60 seconds.
            </Animated.Text>
          </View>

        </View>

        {/* ── Feature chips ──────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(1080).duration(500)}
          style={styles.chips}
        >
          {FEATURES.map((f) => (
            <View
              key={f.label}
              style={[styles.chip, { borderColor: f.color + '30' }]}
            >
              <Ionicons name={f.icon} size={13} color={f.color} />
              <Text style={[styles.chipLabel, { color: f.color }]}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(1220).duration(500)}
          style={styles.ctaBlock}
        >
          <GradientButton
            title="Start my first scan"
            onPress={completeOnboarding}
            size="lg"
            style={styles.ctaBtn}
            trailingIcon={<Ionicons name="arrow-forward" size={15} color="#fff" />}
          />
          <Text style={styles.trustLine}>Free to try · No credit card needed</Text>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  bgGlow: {
    position: 'absolute',
    top: 0,
    left: -80,
    right: -80,
    height: 520,
  },

  safe: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },

  // ── Hero
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['2xl'],
  },

  // ── Logo mark rings
  markWrapper: {
    width: 164,
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  middleRing: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.13)',
    backgroundColor: 'rgba(59,130,246,0.03)',
  },
  markBox: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: 'rgba(59,130,246,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle inner shadow via shadow color
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },

  // ── Wordmark
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiBadge: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  aiBadgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
  },

  // ── Headline
  headlineBlock: {
    alignItems: 'center',
  },
  headline: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
    textAlign: 'center',
    lineHeight: FONTS.sizes['3xl'] * 1.08,
  },
  headlineAccent: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.accent,
    letterSpacing: TRACKING.display,
    textAlign: 'center',
    lineHeight: FONTS.sizes['3xl'] * 1.08,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    lineHeight: FONTS.sizes.sm * 1.78,
    textAlign: 'center',
  },

  // ── Feature chips
  chips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: COLORS.glass.bg,
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemibold,
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
