import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PREMIUM_PLANS } from '../../../constants';
import type { SubscriptionPlanId } from '../../../subscription/subscription';
import { PlanOfferCard } from '../../Subscription/paywall/PlanOfferCard';
import { MANAGE_PLAN_ORDER, managePlanBadge } from './managePlanOrder';

interface ManagePlanPickerProps {
  selected: SubscriptionPlanId;
  currentPlanId?: SubscriptionPlanId | null;
  onSelect: (planId: SubscriptionPlanId) => void;
}

export function ManagePlanPicker({ selected, currentPlanId, onSelect }: ManagePlanPickerProps) {
  return (
    <View style={styles.wrap}>
      {MANAGE_PLAN_ORDER.map((planId) => {
        const plan = PREMIUM_PLANS.find((p) => p.id === planId)!;
        return (
          <PlanOfferCard
            key={planId}
            plan={plan}
            selected={selected === planId}
            featured={planId === 'monthly'}
            badge={managePlanBadge(planId, currentPlanId)}
            onPress={() => onSelect(planId)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});
