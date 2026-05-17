import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent,
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
  step: string;
  icon: SlideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  hint?: string;
}[] = [
  {
    id: '1',
    step: 'Welcome',
    icon: 'hand-right-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.10)',
    title: 'Welcome to\nPhysiqueMax',
    subtitle: 'Your AI physique coach. Here is a quick tour so you know exactly where everything is.',
  },
  {
    id: '2',
    step: 'Step 1',
    icon: 'scan-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.10)',
    title: 'Run your\nfirst scan',
    subtitle: 'On the Home tab, tap **Start AI Scan**. Upload 1–3 photos (front, side, back) for the best results.',
    hint: 'Home → Start AI Scan',
  },
  {
    id: '3',
    step: 'Step 2',
    icon: 'analytics-outline',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.10)',
    title: 'Read your\nAI report',
    subtitle: 'After the scan finishes, open your report for overall score, body fat, symmetry, and 11 muscle group ratings.',
    hint: 'Home → View report',
  },
  {
    id: '4',
    step: 'Step 3',
    icon: 'grid-outline',
    iconColor: '#22C55E',
    iconBg: 'rgba(34,197,94,0.10)',
    title: 'Explore the\napp tabs',
    subtitle: '**History** — past scans. **Progress** — track changes over time. **AI Coach** — personalized tips. **Profile** — account & settings.',
    hint: 'Bottom navigation bar',
  },
  {
    id: '5',
    step: 'Step 4',
    icon: 'trophy-outline',
    iconColor: '#D97706',
    iconBg: 'rgba(217,119,6,0.10)',
    title: 'Stay\nconsistent',
    subtitle: 'Scan regularly to build your streak, earn XP, and climb ranks from Beginner to Elite.',
    hint: 'Daily scan = streak + XP',
  },
];

function renderSubtitle(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={styles.subtitle}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={styles.subtitleBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const finishTutorial = () => {
    completeOnboarding();
    navigation.replace('MainTabs');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      finishTutorial();
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Text style={styles.topLabel}>Quick tour</Text>
          <Text style={styles.topStep}>{currentIndex + 1} / {SLIDES.length}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s) => (
            <Animated.View key={s.id} entering={FadeIn.duration(350)} style={[styles.slide, { width }]}>
              <View style={[styles.stepPill, { borderColor: s.iconColor + '40' }]}>
                <Text style={[styles.stepPillText, { color: s.iconColor }]}>{s.step}</Text>
              </View>

              <View style={[styles.iconContainer, { backgroundColor: s.iconBg, borderColor: s.iconColor + '25' }]}>
                <Ionicons name={s.icon} size={56} color={s.iconColor} />
              </View>

              <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.title}>
                {s.title}
              </Animated.Text>

              <Animated.View entering={FadeInDown.delay(320).duration(500)}>
                {renderSubtitle(s.subtitle)}
              </Animated.View>

              {s.hint ? (
                <View style={styles.hintBox}>
                  <Ionicons name="navigate-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.hintText}>{s.hint}</Text>
                </View>
              ) : null}
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.dot,
                  i === currentIndex && [styles.dotActive, { backgroundColor: s.iconColor }],
                ]}
              />
            ))}
          </View>

          <GradientButton
            title={isLast ? 'Start using the app' : 'Next'}
            onPress={handleNext}
            size="lg"
            style={styles.btn}
          />

          <TouchableOpacity onPress={finishTutorial} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip tour</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.base,
  },
  topLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  topStep: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  stepPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: SPACING.xl,
  },
  stepPillText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
  subtitleBold: {
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  hintText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
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
