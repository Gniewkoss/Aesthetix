import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../../theme';
import { formatSubscriptionDate } from '../../../subscription/subscription';
import { subscriptionStyles } from './subscriptionStyles';

interface BillingInfoProps {
  nextBillingLabel: string;
  nextBillingDate: string | null;
  paymentMethod?: string;
  autoRenew: boolean;
}

export function BillingInfo({
  nextBillingLabel,
  nextBillingDate,
  paymentMethod = 'Apple Pay / App Store',
  autoRenew,
}: BillingInfoProps) {
  return (
    <View>
      <Text style={subscriptionStyles.sectionLabel}>BILLING</Text>
      <GlassCard padding={0}>
        <View style={[styles.row, subscriptionStyles.rowBorder]}>
          <View style={styles.rowLeft}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.rowLabel}>{nextBillingLabel}</Text>
          </View>
          <Text style={styles.rowValue}>
            {nextBillingDate ? formatSubscriptionDate(nextBillingDate) : '—'}
          </Text>
        </View>

        <View style={[styles.row, subscriptionStyles.rowBorder]}>
          <View style={styles.rowLeft}>
            <Ionicons name="card-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.rowLabel}>Payment method</Text>
          </View>
          <Text style={styles.rowValue} numberOfLines={1}>
            {paymentMethod}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="refresh-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.rowLabel}>Auto-renew</Text>
          </View>
          <Text style={[styles.rowValue, { color: autoRenew ? COLORS.green : COLORS.amber }]}>
            {autoRenew ? 'On' : 'Off'}
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  rowLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
  },
  rowValue: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    maxWidth: '48%',
    textAlign: 'right',
  },
});
