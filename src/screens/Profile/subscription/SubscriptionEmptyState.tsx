import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { ObsButton } from '../../../components/obsidian/ObsButton';
import type { SubscriptionPlanId } from '../../../subscription/subscription';
import { ManagePlanPicker } from './ManagePlanPicker';
import { planById } from '../../Subscription/paywall/PlanOfferCard';

interface SubscriptionEmptyStateProps {
  onSubscribe: (planId: SubscriptionPlanId) => void;
  loading?: boolean;
}

export function SubscriptionEmptyState({ onSubscribe, loading }: SubscriptionEmptyStateProps) {
  const [selected, setSelected] = useState<SubscriptionPlanId>('monthly');
  const meta = planById(selected);

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <View style={styles.iconWrap}>
          <Ionicons name="flash" size={22} color={C.voltInk} />
        </View>
        <Text style={[T.title, { color: C.text, textAlign: 'center' }]}>Upgrade your training</Text>
        <Text style={[T.bodySm, { color: C.text2, textAlign: 'center', marginTop: S.sm, lineHeight: 21 }]}>
          Pick Starter, Pro, or Max. All paid plans include front + back scans and your AI improvement plan.
        </Text>
      </View>

      <Text style={[T.overline, styles.plansLabel, { color: C.text3 }]}>AVAILABLE PLANS</Text>
      <ManagePlanPicker selected={selected} onSelect={setSelected} />

      <ObsButton
        title={loading ? 'Processing…' : `Continue with ${meta.name}`}
        onPress={() => onSubscribe(selected)}
        loading={loading}
        glow
        icon="flash"
        style={styles.cta}
      />
      <Text style={[T.caption, { color: C.text3, textAlign: 'center', marginTop: S.sm }]}>
        {meta.price}/{meta.period === 'week' ? 'week' : 'month'} · Billed through App Store / Play
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: S.sm },
  heroCard: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    alignItems: 'center',
    marginBottom: S.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: R.md,
    backgroundColor: C.volt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  plansLabel: { marginBottom: S.md, letterSpacing: 1 },
  cta: { width: '100%', marginTop: S.lg, height: 52 },
});
