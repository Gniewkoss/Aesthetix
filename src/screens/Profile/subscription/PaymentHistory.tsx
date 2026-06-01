import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { formatSubscriptionDate } from '../../../subscription/subscription';
import type { PaymentRecord } from '../../../subscription/paymentHistory';
import { subscriptionStyles } from './subscriptionStyles';

interface PaymentHistoryProps {
  payments: PaymentRecord[];
}

const STATUS_STYLE: Record<PaymentRecord['status'], { color: string; label: string }> = {
  paid: { color: C.success, label: 'Paid' },
  trial: { color: C.volt, label: 'Trial' },
  pending: { color: C.warning, label: 'Upcoming' },
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <View>
      <Text style={subscriptionStyles.sectionLabel}>PAYMENT HISTORY</Text>
      <View style={styles.card}>
        {payments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={26} color={C.text3} />
            <Text style={[T.body, { color: C.text2, marginTop: S.md, fontSize: 15 }]}>No payments yet</Text>
            <Text style={[T.caption, { color: C.text3, textAlign: 'center', marginTop: 2, lineHeight: 17 }]}>
              Your billing history will appear here after your first charge.
            </Text>
          </View>
        ) : (
          payments.map((payment, i) => {
            const s = STATUS_STYLE[payment.status];
            return (
              <View key={payment.id} style={[styles.row, i < payments.length - 1 && subscriptionStyles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={[T.body, { color: C.text, fontSize: 15 }]}>{payment.description}</Text>
                  <Text style={[T.caption, { color: C.text3, marginTop: 2 }]}>{formatSubscriptionDate(payment.date)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[T.label, { color: C.text }]}>{payment.amount}</Text>
                  <Text style={[T.overline, { color: s.color, marginTop: 3 }]}>{s.label.toUpperCase()}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...E.card, borderRadius: R.xl, overflow: 'hidden' },
  empty: { alignItems: 'center', paddingVertical: S['2xl'], paddingHorizontal: LAYOUT.cardPad },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.cardPad,
    paddingVertical: 14,
    gap: S.md,
  },
});
