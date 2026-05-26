import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONTS, GRADIENTS, RADIUS, SPACING } from '../../../theme';
import { getPlanById, type Subscription } from '../../../subscription/subscription';
import type { SubscriptionDisplayStatus } from '../../../subscription/subscription';
import { StatusBadge } from './StatusBadge';

interface SubscriptionOverviewProps {
  displayStatus: SubscriptionDisplayStatus;
  subscription: Subscription | null;
  isPremium: boolean;
}

export function SubscriptionOverview({
  displayStatus,
  subscription,
  isPremium,
}: SubscriptionOverviewProps) {
  const plan = subscription ? getPlanById(subscription.planId) : null;
  const isTrialing = subscription?.status === 'trialing';
  const showPremium = isPremium && displayStatus !== 'none';

  return (
    <LinearGradient
      colors={showPremium ? [...GRADIENTS.premium] : [...GRADIENTS.dark]}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={showPremium ? 'flash' : 'leaf-outline'} size={20} color="#fff" />
        </View>
        <StatusBadge status={displayStatus} trial={isTrialing} />
      </View>

      <Text style={styles.planName}>
        {showPremium && plan ? plan.name : 'Free'}
      </Text>
      <Text style={styles.planMeta}>
        {showPremium && plan
          ? `${plan.price} / ${plan.period}`
          : 'No active subscription'}
      </Text>

      {showPremium && plan && (
        <Text style={styles.billingCycle}>
          Billed {plan.period === 'week' ? 'weekly' : plan.period === 'month' ? 'monthly' : 'yearly'}
        </Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: '#fff',
    letterSpacing: 0.2,
  },
  planMeta: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    marginTop: 4,
  },
  billingCycle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    marginTop: 6,
  },
});
