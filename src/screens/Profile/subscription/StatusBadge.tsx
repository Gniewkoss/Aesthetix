import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, RADIUS } from '../../../theme';
import type { SubscriptionDisplayStatus } from '../../../subscription/subscription';

const STATUS_CONFIG: Record<
  SubscriptionDisplayStatus,
  { label: string; bg: string; color: string }
> = {
  active: { label: 'Active', bg: COLORS.greenDim, color: COLORS.green },
  expiring: { label: 'Expiring', bg: COLORS.amberDim, color: COLORS.amber },
  cancelled: { label: 'Cancelled', bg: COLORS.redDim, color: COLORS.red },
  none: { label: 'Free', bg: 'rgba(255,255,255,0.06)', color: COLORS.text.muted },
};

interface StatusBadgeProps {
  status: SubscriptionDisplayStatus;
  trial?: boolean;
}

export function StatusBadge({ status, trial }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const label = trial && status === 'active' ? 'Free trial' : config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.color + '35' }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{label}</Text>
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
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 0.4,
  },
});
