import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, T, R } from '../../../theme/obsidian';
import type { SubscriptionDisplayStatus } from '../../../subscription/subscription';

const STATUS_CONFIG: Record<SubscriptionDisplayStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: C.success },
  expiring: { label: 'Expiring', color: C.warning },
  cancelled: { label: 'Cancelled', color: C.danger },
  none: { label: 'Free', color: C.text2 },
};

interface StatusBadgeProps {
  status: SubscriptionDisplayStatus;
  trial?: boolean;
}

export function StatusBadge({ status, trial }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const label = trial && status === 'active' ? 'Free trial' : config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '1A', borderColor: config.color + '40' }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[T.overline, { color: config.color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
