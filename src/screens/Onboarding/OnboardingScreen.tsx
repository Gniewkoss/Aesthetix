import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { useAuthStore } from '../../store/useAuthStore';
import { C, T, R, S, LAYOUT, layoutScreenPaddingX } from '../../theme/obsidian';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string; description: string }[] = [
  { icon: 'scan-outline', label: 'AI Scan', description: 'Full physique analysis in 60 seconds' },
  { icon: 'analytics-outline', label: '11 Muscle Groups', description: 'Detailed breakdown of every muscle group' },
  { icon: 'trending-up-outline', label: 'Progress', description: 'Track scores and improvements over time' },
];

const textAndroid = Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : null;

export function OnboardingScreen(_props: Props) {
  const reduceMotion = useReducedMotion();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const insets = useSafeAreaInsets();
  const screenPad = layoutScreenPaddingX(insets);

  const enter = (d: number) => reduceMotion ? undefined : FadeInDown.delay(d).duration(400);

  return (
    <View style={styles.root}>
      {/* Soft Volt bloom — smooth radial, no hard edge */}
      <Svg style={styles.bloom} pointerEvents="none">
        <Defs>
          <RadialGradient id="onbBloom" cx="50%" cy="38%" r="55%">
            <Stop offset="0" stopColor={C.volt} stopOpacity={0.14} />
            <Stop offset="0.55" stopColor={C.volt} stopOpacity={0.04} />
            <Stop offset="1" stopColor={C.volt} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#onbBloom)" />
      </Svg>

      <SafeAreaView style={[styles.safe, screenPad]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.main}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(500)} style={styles.brandBlock}>
            <AesthetixLogo variant="wordmark" width={200} style={styles.brandLogo} />
          </Animated.View>

          <Animated.View entering={enter(280)} style={styles.hero}>
            <View style={styles.headline}>
              <Text style={[styles.headlineLine, textAndroid]}>Your physique,</Text>
              <Text style={[styles.headlineLine, styles.headlineAccent, textAndroid]}>analyzed by AI.</Text>
              <Text style={[styles.subtitle, textAndroid]}>
                Upload 3 photos. Get a complete breakdown of 11 muscle groups in under 60 seconds.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(420).duration(450)} style={styles.featureCard}>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={16} color={C.volt} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[T.body, { color: C.text, fontSize: 15 }]}>{f.label}</Text>
                <Text style={[T.caption, { color: C.text3, marginTop: 1 }]}>{f.description}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
          <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(520).duration(450)} style={styles.ctaBlock}>
            <ObsButton title="Start my first scan" onPress={completeOnboarding} glow icon="arrow-forward" style={{ width: '100%', height: 56 }} />
            <Text style={styles.ctaCaption}>Free to try · No credit card needed</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  bloom: { position: 'absolute', top: 0, left: 0, right: 0, height: 520 },

  safe: { flex: 1 },
  main: {
    flex: 1,
    paddingTop: S.xl,
    paddingBottom: S.xl,
    justifyContent: 'space-between',
  },

  brandBlock: {
    alignItems: 'flex-start',
  },
  brandLogo: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },

  hero: {
    flexShrink: 1,
    justifyContent: 'center',
    paddingVertical: S.lg,
  },
  headline: {
    gap: Platform.OS === 'android' ? S.sm : S.xs,
  },
  headlineLine: {
    ...T.h1,
    fontSize: 40,
    lineHeight: Platform.OS === 'android' ? 46 : 44,
    letterSpacing: -1.1,
    color: C.text,
    includeFontPadding: false,
    backgroundColor: 'transparent',
  },
  headlineAccent: {
    color: C.volt,
  },
  subtitle: {
    ...T.body,
    color: C.text2,
    marginTop: S.sm,
    includeFontPadding: false,
  },

  featureCard: {
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    minHeight: 56,
    paddingVertical: S.md,
    paddingHorizontal: LAYOUT.cardPad,
  },
  featureBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: R.sm,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  ctaBlock: {
    gap: S.md,
    alignItems: 'stretch',
  },
  ctaCaption: {
    ...T.caption,
    color: C.text3,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
