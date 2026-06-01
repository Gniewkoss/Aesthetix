import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { formatSubscriptionDate } from '../../../subscription/subscription';
import { subscriptionStyles } from './subscriptionStyles';

interface BillingInfoProps {
  nextBillingLabel: string;
  nextBillingDate: string | null;
  paymentMethod?: string;
  autoRenew: boolean;
}

export function BillingInfo({
  nextBillingLabel, nextBillingDate, paymentMethod = 'Apple Pay / App Store', autoRenew,
}: BillingInfoProps) {
  return (
    <View>
      <Text style={subscriptionStyles.sectionLabel}>BILLING</Text>
      <View style={styles.card}>
        <Row icon="calendar-outline" label={nextBillingLabel} value={nextBillingDate ? formatSubscriptionDate(nextBillingDate) : '—'} border />
        <Row icon="card-outline" label="Payment method" value={paymentMethod} border />
        <Row icon="refresh-outline" label="Auto-renew" value={autoRenew ? 'On' : 'Off'} valueColor={autoRenew ? C.success : C.warning} />
      </View>
    </View>
  );
}

function Row({ icon, label, value, valueColor, border }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; valueColor?: string; border?: boolean;
}) {
  return (
    <View style={[styles.row, border && subscriptionStyles.rowBorder]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={16} color={C.text2} />
        <Text style={[T.bodySm, { color: C.text2 }]}>{label}</Text>
      </View>
      <Text style={[T.label, styles.rowValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...E.card, borderRadius: R.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.cardPad,
    paddingVertical: 14,
    gap: S.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flex: 1 },
  rowValue: { color: C.text, maxWidth: '48%', textAlign: 'right' },
});
