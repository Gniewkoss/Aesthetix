import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SHADOWS, SPACING } from '../../theme';
import { CoachStep, useOnboardingStore } from '../../store/useOnboardingStore';

type StepConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  body: string;
  cta: string;
};

const STEP_CONFIG: Partial<Record<CoachStep, StepConfig>> = {
  scan: {
    icon: 'scan-outline',
    iconColor: COLORS.accent,
    title: 'Start here',
    body: 'Tap "Start AI Scan" above to upload your front, side, and back photos. Your first physique report takes under 60 seconds.',
    cta: 'Got it',
  },
  tabs: {
    icon: 'grid-outline',
    iconColor: '#8B5CF6',
    title: 'Explore the app',
    body: 'Use the bottom nav to view scan History, track Progress over time, or chat with your AI Coach.',
    cta: 'Got it',
  },
};

// Delay before the bubble slides in on mount (ms)
const ENTRY_DELAY = 1400;

export function CoachBubble() {
  const { coachStep, advanceCoach, isHydrated } = useOnboardingStore();
  const config = STEP_CONFIG[coachStep];

  const translateY = useSharedValue(160);
  const opacity = useSharedValue(0);
  const isDismissingRef = useRef(false);

  const visible = isHydrated && !!config;

  useEffect(() => {
    if (!visible) return;
    isDismissingRef.current = false;
    // Slide in from below
    translateY.value = withDelay(ENTRY_DELAY, withSpring(0, { damping: 18, stiffness: 200 }));
    opacity.value = withDelay(ENTRY_DELAY, withTiming(1, { duration: 300 }));
  }, [visible, coachStep]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const dismiss = () => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Slide out then advance coach step
    translateY.value = withTiming(160, { duration: 280 }, (done) => {
      if (done) runOnJS(advanceCoach)();
    });
    opacity.value = withTiming(0, { duration: 220 });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.bubble, animStyle]} pointerEvents="box-none">
      {/* Dismiss tap target outside the card */}
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

      <View style={styles.card}>
        {/* Top row */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: config!.iconColor + '18' }]}>
            <Ionicons name={config!.icon} size={18} color={config!.iconColor} />
          </View>
          <Text style={styles.title}>{config!.title}</Text>
          <TouchableOpacity onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <Text style={styles.body}>{config!.body}</Text>

        {/* CTA */}
        <TouchableOpacity onPress={dismiss} activeOpacity={0.75} style={styles.ctaRow}>
          <Text style={styles.ctaText}>{config!.cta}</Text>
          <Ionicons name="arrow-forward" size={13} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    // Pointer events on the overlay itself — the Pressable handles outside taps
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.accent,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
  },
  closeBtn: {
    padding: 4,
  },

  body: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.65,
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
  },
  ctaText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
});
