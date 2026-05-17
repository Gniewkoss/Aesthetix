import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/ui/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

type SlideIcon = keyof typeof Ionicons.glyphMap;

const SLIDES: {
  id: string;
  icon: SlideIcon;
  iconColor: string;
  iconBg: string;
  badge: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: '1',
    icon: 'scan-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.10)',
    badge: 'POWERED BY GPT-4o',
    title: 'AI Physique\nAnalyzer',
    subtitle: 'Get a precise, professional assessment of your physique in seconds using computer vision.',
  },
  {
    id: '2',
    icon: 'stats-chart',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.10)',
    badge: 'PRECISION SCORING',
    title: '11 Muscle\nGroups Scored',
    subtitle: 'Every muscle group analyzed, scored, and ranked against elite benchmarks.',
  },
  {
    id: '3',
    icon: 'trending-up',
    iconColor: '#22C55E',
    iconBg: 'rgba(34,197,94,0.10)',
    badge: 'AI COACH INSIDE',
    title: 'Physique\nPrediction',
    subtitle: 'See your predicted transformation with a personalized improvement roadmap.',
  },
  {
    id: '4',
    icon: 'trophy-outline',
    iconColor: '#D97706',
    iconBg: 'rgba(217,119,6,0.10)',
    badge: 'GAMIFIED FITNESS',
    title: 'Track Your\nProgress',
    subtitle: 'Streak system, XP ranking, and before/after progress to keep you consistent.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const goToAuth = () => {
    completeOnboarding();
    navigation.replace('Auth');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      goToAuth();
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s, i) => (
            <Animated.View key={s.id} entering={FadeIn.duration(350)} style={[styles.slide, { width }]}>

              {/* Badge */}
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: s.iconColor }]}>{s.badge}</Text>
              </View>

              {/* Icon container */}
              <View style={[styles.iconContainer, { backgroundColor: s.iconBg, borderColor: s.iconColor + '25' }]}>
                <Ionicons name={s.icon} size={56} color={s.iconColor} />
              </View>

              {/* Title */}
              <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.title}>
                {s.title}
              </Animated.Text>

              {/* Subtitle */}
              <Animated.Text entering={FadeInDown.delay(320).duration(500)} style={styles.subtitle}>
                {s.subtitle}
              </Animated.Text>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Bottom controls */}
        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex && [styles.dotActive, { backgroundColor: slide.iconColor }],
                ]}
              />
            ))}
          </View>

          <GradientButton
            title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            size="lg"
            style={styles.btn}
          />

          <TouchableOpacity onPress={goToAuth} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: SPACING['2xl'],
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 1.8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING['3xl'],
    borderWidth: 1,
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: FONTS.sizes['3xl'] * 1.05,
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: FONTS.sizes.base * 1.65,
  },
  bottom: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: SPACING['2xl'],
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
  },
  btn: {
    width: '100%',
  },
  skipBtn: {
    marginTop: SPACING.base,
    padding: SPACING.sm,
  },
  skipText: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
});
