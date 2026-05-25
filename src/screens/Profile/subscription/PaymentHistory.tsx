import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../../theme';
import { formatSubscriptionDate } from '../../../subscription/subscription';
import type { PaymentRecord } from '../../../subscription/paymentHistory';
import { subscriptionStyles } from './subscriptionStyles';

interface PaymentHistoryProps {
  payments: PaymentRecord[];
}

const STATUS_STYLE: Record<PaymentRecord['status'], { color: string; label: string }> = {
  paid: { color: COLORS.green, label: 'Paid' },
  trial: { color: COLORS.accent, label: 'Trial' },
  pending: { color: COLORS.amber, label: 'Upcoming' },
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <View>
      <Text style={subscriptionStyles.sectionLabel}>PAYMENT HISTORY</Text>
      <GlassCard padding={0}>
        {payments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={28} color={COLORS.text.disabled} />
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptySub}>
              Your billing history will appear here after your first charge.
            </Text>
          </View>
        ) : (
          payments.map((payment, i) => {
            const statusStyle = STATUS_STYLE[payment.status];
            return (
              <View
                key={payment.id}
                style={[styles.row, i < payments.length - 1 && subscriptionStyles.rowBorder]}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.description}>{payment.description}</Text>
                  <Text style={styles.date}>{formatSubscriptionDate(payment.date)}</Text>
                </View>
                <View style={styles.rowEnd}>
                  <Text style={styles.amount}>{payment.amount}</Text>
                  <Text style={[styles.status, { color: statusStyle.color }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptySub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: FONTS.sizes.xs * 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  rowMain: { flex: 1 },
  description: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.primary,
  },
  date: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  rowEnd: { alignItems: 'flex-end' },
  amount: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  status: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    marginTop: 3,
    letterSpacing: 0.3,
  },
});
