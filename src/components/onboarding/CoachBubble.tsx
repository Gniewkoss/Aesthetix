import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SHADOWS, SPACING } from '../../theme';
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
    iconColor: COLORS.score.good,
    title: 'Explore the app',
    body: 'Use the bottom nav to view scan History, track Progress over time, or chat with your AI Coach.',
    cta: 'Got it',
  },
};

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

    translateY.value = withTiming(160, { duration: 280 }, (done) => {
      if (done) runOnJS(advanceCoach)();
    });
    opacity.value = withTiming(0, { duration: 220 });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.bubble, animStyle]}
      pointerEvents="box-none"
      accessibilityViewIsModal
    >
      <View style={styles.card} accessibilityRole="alert">
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: config!.iconColor + '18' }]}>
            <Ionicons name={config!.icon} size={18} color={config!.iconColor} />
          </View>
          <Text style={styles.title}>{config!.title}</Text>
          <TouchableOpacity
            onPress={dismiss}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Dismiss coach tip"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={16} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.body}>{config!.body}</Text>

        <TouchableOpacity
          onPress={dismiss}
          activeOpacity={0.75}
          style={styles.ctaRow}
          accessibilityLabel={config!.cta}
          accessibilityRole="button"
        >
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
    bottom: LAYOUT.coachBubbleBottom,
    left: 0,
    right: 0,
    paddingHorizontal: LAYOUT.pagePad,
  },
  card: {
    backgroundColor: COLORS.bg.elevated,
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
    width: LAYOUT.minTouchTarget,
    height: LAYOUT.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },

  body: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * FONTS.lineHeights.relaxed,
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
    minHeight: LAYOUT.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  ctaText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
});
