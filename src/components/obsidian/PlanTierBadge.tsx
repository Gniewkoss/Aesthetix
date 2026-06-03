import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, HEADER_PILL } from '../../theme/obsidian';
import { PressableScale } from '../../screens/Dashboard/home/PressableScale';
import { isPaidTier, TIER_LABELS, type SubscriptionTier } from '../../subscription/tiers';

interface PlanTierBadgeProps {
  tier: SubscriptionTier;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Plan tier pill — shared styling on Home, AI Coach, etc. */
export function PlanTierBadge({ tier, onPress, accessibilityLabel, style }: PlanTierBadgeProps) {
  const paid = isPaidTier(tier);
  const label = TIER_LABELS[tier].toUpperCase();

  const pill = (
    <View style={[styles.badge, paid ? styles.proBadge : styles.freeBadge]}>
      {paid && <Ionicons name="flash" size={10} color={C.voltInk} />}
      <Text style={[T.overline, { color: paid ? C.voltInk : C.text3 }]}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return <View style={style}>{pill}</View>;
  }

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? `${label} plan`}
      style={style}
    >
      {pill}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  badge: {
    ...HEADER_PILL,
  },
  proBadge: { backgroundColor: C.volt },
  freeBadge: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.borderMd,
  },
});
