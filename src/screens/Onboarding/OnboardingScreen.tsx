import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { useAuthStore } from '../../store/useAuthStore';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string; description: string }[] = [
  { icon: 'scan-outline', label: 'AI Scan', description: 'Full physique analysis in 60 seconds' },
  { icon: 'analytics-outline', label: '11 Muscle Groups', description: 'Detailed breakdown of every muscle group' },
  { icon: 'trending-up-outline', label: 'Progress', description: 'Track scores and improvements over time' },
];

export function OnboardingScreen(_props: Props) {
  const reduceMotion = useReducedMotion();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

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

      <SafeAreaView style={styles.safe}>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(500)} style={styles.brandBlock}>
          <AesthetixLogo variant="mark" width={96} height={96} color={C.text} />
        </Animated.View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.headline}>
            <Animated.Text entering={enter(280)} style={[T.h1, styles.line]}>Your physique,</Animated.Text>
            <Animated.Text entering={enter(360)} style={[T.h1, styles.line, { color: C.volt }]}>analyzed by AI.</Animated.Text>
            <Animated.Text entering={reduceMotion ? undefined : FadeIn.delay(520).duration(500)} style={[T.body, styles.subtitle]}>
              Upload 3 photos. Get a complete breakdown of 11 muscle groups in under 60 seconds.
            </Animated.Text>
          </View>
        </View>

        {/* Features */}
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(620).duration(450)} style={styles.featureCard}>
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
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(720).duration(450)} style={styles.ctaBlock}>
          <ObsButton title="Start my first scan" onPress={completeOnboarding} glow icon="arrow-forward" style={{ width: '100%', height: 56 }} />
          <Text style={[T.caption, { color: C.text3 }]}>Free to try · No credit card needed</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  bloom: { position: 'absolute', top: 0, left: 0, right: 0, height: 520 },

  safe: { flex: 1, paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, paddingBottom: S.xl },

  brandBlock: {
    alignItems: 'center',
    paddingTop: S['3xl'],
    marginBottom: S['2xl'],
  },

  hero: { flex: 1, justifyContent: 'flex-start', paddingTop: S.lg },
  headline: { gap: 0 },
  line: { fontSize: 40, lineHeight: 44, color: C.text },
  subtitle: { color: C.text2, marginTop: S.base, lineHeight: 24 },

  featureCard: {
    backgroundColor: C.surface1, borderWidth: 1, borderColor: C.border, borderRadius: R.xl,
    marginBottom: S.xl, overflow: 'hidden',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: LAYOUT.cardPad },
  featureBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  featureIcon: {
    width: 34, height: 34, borderRadius: R.sm, backgroundColor: C.voltDim,
    borderWidth: 1, borderColor: C.voltBorder, alignItems: 'center', justifyContent: 'center',
  },

  ctaBlock: { gap: S.md, alignItems: 'center' },
});
