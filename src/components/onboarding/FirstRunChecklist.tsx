import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Step = {
  id: string;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  done: boolean;
  action?: () => void;
};

interface Props {
  hasScan: boolean;
}

export function FirstRunChecklist({ hasScan }: Props) {
  const navigation = useNavigation<Nav>();
  const { checklistDismissed, dismissChecklist, coachStep } = useOnboardingStore();

  // Hide after all steps done AND user has seen the tabs coach mark
  const allDone = hasScan && coachStep === 'done';

  if (checklistDismissed) return null;

  const steps: Step[] = [
    {
      id: 'scan',
      label: 'Run your first scan',
      sublabel: hasScan ? 'Complete' : 'Upload front + side photos',
      icon: hasScan ? 'checkmark-circle' : 'scan-outline',
      done: hasScan,
      action: hasScan ? undefined : () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('Upload');
      },
    },
    {
      id: 'report',
      label: 'View your AI report',
      sublabel: hasScan ? 'Complete' : 'Available after first scan',
      icon: hasScan ? 'checkmark-circle' : 'analytics-outline',
      done: hasScan,
    },
    {
      id: 'explore',
      label: 'Explore History & Progress',
      sublabel: coachStep === 'done' ? 'Complete' : 'Tap the bottom nav tabs',
      icon: coachStep === 'done' ? 'checkmark-circle' : 'grid-outline',
      done: coachStep === 'done',
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissChecklist();
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)} exiting={FadeOutUp.duration(250)}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Getting started</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>{doneCount} / {steps.length}</Text>
            </View>
          </View>
          {allDone && (
            <TouchableOpacity onPress={handleDismiss} hitSlop={12} style={styles.dismissBtn}>
              <Ionicons name="close" size={15} color={COLORS.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(doneCount / steps.length) * 100}%` as any },
            ]}
          />
        </View>

        {/* Steps */}
        {steps.map((step, i) => (
          <TouchableOpacity
            key={step.id}
            onPress={step.action}
            activeOpacity={step.action ? 0.7 : 1}
            style={[styles.step, i < steps.length - 1 && styles.stepBorder]}
          >
            <Ionicons
              name={step.icon}
              size={20}
              color={step.done ? COLORS.green : step.id === 'scan' && !hasScan ? COLORS.accent : COLORS.text.disabled}
            />
            <View style={styles.stepText}>
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                {step.label}
              </Text>
              <Text style={styles.stepSublabel}>{step.sublabel}</Text>
            </View>
            {step.action && (
              <Ionicons name="chevron-forward" size={14} color={COLORS.accent} />
            )}
          </TouchableOpacity>
        ))}

        {/* Completion state */}
        {allDone && (
          <View style={styles.completedRow}>
            <Ionicons name="trophy-outline" size={14} color={COLORS.amber} />
            <Text style={styles.completedText}>You're all set — scan daily to build your streak!</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
    letterSpacing: 0.3,
  },
  progressPill: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  dismissBtn: {
    padding: 4,
  },

  progressBarTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  stepText: {
    flex: 1,
    gap: 2,
  },
  stepLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  stepLabelDone: {
    color: COLORS.text.muted,
    textDecorationLine: 'line-through',
  },
  stepSublabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: SPACING.xs,
  },
  completedText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    flex: 1,
  },
});
