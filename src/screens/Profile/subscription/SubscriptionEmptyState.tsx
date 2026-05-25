import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GradientButton } from '../../../components/ui/GradientButton';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../../theme';
import { TRIAL_DAYS } from '../../../subscription/subscription';

interface SubscriptionEmptyStateProps {
  onStartTrial: () => void;
  onViewPlans: () => void;
  loading?: boolean;
}

export function SubscriptionEmptyState({
  onStartTrial,
  onViewPlans,
  loading,
}: SubscriptionEmptyStateProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={28} color={COLORS.purple} />
      </View>
      <Text style={styles.title}>Unlock Premium</Text>
      <Text style={styles.subtitle}>
        Unlimited scans, full AI analysis, and progress tracking. Start with a {TRIAL_DAYS}-day
        free trial.
      </Text>
      <GradientButton
        title="Start free trial"
        onPress={onStartTrial}
        loading={loading}
        variant="secondary"
        size="md"
        style={{ width: '100%', marginTop: SPACING.lg }}
      />
      <GradientButton
        title="Compare plans"
        onPress={onViewPlans}
        variant="outline"
        size="md"
        style={{ width: '100%', marginTop: SPACING.sm }}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', marginTop: SPACING.sm },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.purpleDim,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: FONTS.sizes.sm * 1.5,
  },
});
