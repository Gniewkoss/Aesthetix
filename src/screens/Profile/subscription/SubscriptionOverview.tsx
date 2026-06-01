import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import { getPlanById, type Subscription } from '../../../subscription/subscription';
import type { SubscriptionDisplayStatus } from '../../../subscription/subscription';
import { StatusBadge } from './StatusBadge';

interface SubscriptionOverviewProps {
  displayStatus: SubscriptionDisplayStatus;
  subscription: Subscription | null;
  isPremium: boolean;
}

export function SubscriptionOverview({ displayStatus, subscription, isPremium }: SubscriptionOverviewProps) {
  const plan = subscription ? getPlanById(subscription.planId) : null;
  const isTrialing = subscription?.status === 'trialing';
  const showPremium = isPremium && displayStatus !== 'none';

  return (
    <View style={[styles.card, showPremium && styles.cardPremium]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, showPremium ? styles.iconOn : styles.iconOff]}>
          <Ionicons name={showPremium ? 'flash' : 'leaf-outline'} size={20} color={showPremium ? C.voltInk : C.text2} />
        </View>
        <StatusBadge status={displayStatus} trial={isTrialing} />
      </View>

      <Text style={[T.h1, { color: C.text, fontSize: 30 }]}>{showPremium && plan ? plan.name : 'Free'}</Text>
      <Text style={[T.body, { color: C.text2, marginTop: 4 }]}>
        {showPremium && plan ? `${plan.price} / ${plan.period}` : 'No active subscription'}
      </Text>
      {showPremium && plan && (
        <Text style={[T.caption, { color: C.text3, marginTop: 6 }]}>
          Billed {plan.period === 'week' ? 'weekly' : plan.period === 'month' ? 'monthly' : 'yearly'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },
  cardPremium: { backgroundColor: C.voltDim, borderColor: C.voltBorder },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.base },
  iconWrap: { width: 40, height: 40, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: C.volt },
  iconOff: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
});
