import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🤖',
    gradient: ['#7B2FBE', '#00F5FF'] as [string, string],
    title: 'AI Physique\nAnalyzer',
    subtitle: 'Get a brutal, honest, professional assessment of your physique in seconds.',
    badge: 'POWERED BY GPT-4o',
  },
  {
    id: '2',
    emoji: '📊',
    gradient: ['#FF006E', '#7B2FBE'] as [string, string],
    title: '11 Muscle\nGroups Scored',
    subtitle: 'Every muscle group analyzed, scored, and ranked. No hiding from the AI.',
    badge: 'PRECISION SCORING',
  },
  {
    id: '3',
    emoji: '⚡',
    gradient: ['#06FFA5', '#00F5FF'] as [string, string],
    title: 'Glow-Up\nPrediction',
    subtitle: 'See your predicted transformation with a personalized physique improvement plan.',
    badge: 'AI COACH INSIDE',
  },
  {
    id: '4',
    emoji: '🏆',
    gradient: ['#FFD600', '#FF6B00'] as [string, string],
    title: 'Track Your\nProgress',
    subtitle: 'Streak system, XP ranking, and before/after progress to keep you locked in.',
    badge: 'GAMIFIED FITNESS',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      navigation.replace('Auth');
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.root}>
      {/* Gradient background orbs */}
      <LinearGradient
        colors={[slide.gradient[0] + '18', 'transparent']}
        style={styles.orb1}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={[slide.gradient[1] + '12', 'transparent']}
        style={styles.orb2}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

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
            <Animated.View key={s.id} entering={FadeIn.duration(400)} style={[styles.slide, { width }]}>
              {/* Badge */}
              <View style={[styles.badge, { borderColor: s.gradient[0] + '50' }]}>
                <Text style={[styles.badgeText, { color: s.gradient[0] }]}>{s.badge}</Text>
              </View>

              {/* Emoji display */}
              <LinearGradient
                colors={[s.gradient[0] + '25', s.gradient[1] + '15']}
                style={styles.emojiContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.emoji}>{s.emoji}</Text>
              </LinearGradient>

              {/* Title */}
              <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
                {s.title}
              </Animated.Text>

              {/* Subtitle */}
              <Animated.Text entering={FadeInDown.delay(350).duration(600)} style={styles.subtitle}>
                {s.subtitle}
              </Animated.Text>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Bottom controls */}
        <View style={styles.bottom}>
          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex && [styles.dotActive, { backgroundColor: slide.gradient[0] }],
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

          <TouchableOpacity onPress={() => navigation.replace('Auth')} style={styles.skipBtn}>
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
  orb1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -100,
    left: -100,
  },
  orb2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: 100,
    right: -80,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: SPACING['2xl'],
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 2,
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: FONTS.weights.black,
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: FONTS.sizes['3xl'] * 1.1,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: FONTS.sizes.md * 1.6,
  },
  bottom: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: SPACING['2xl'],
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
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
    fontWeight: FONTS.weights.medium,
  },
});
