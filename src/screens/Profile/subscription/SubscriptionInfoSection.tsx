import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { FREE_PLAN_LIMITS } from '../../../subscription/subscription';
import { subscriptionStyles } from './subscriptionStyles';

interface SubscriptionInfoSectionProps {
  periodEndDate: string | null;
  showCancelInfo: boolean;
}

export function SubscriptionInfoSection({ periodEndDate, showCancelInfo }: SubscriptionInfoSectionProps) {
  const showCancel = showCancelInfo && periodEndDate;
  return (
    <View>
      <Text style={subscriptionStyles.sectionLabel}>GOOD TO KNOW</Text>
      <View style={styles.card}>
        {showCancel && (
          <View>
            <View style={styles.blockHeader}>
              <Ionicons name="information-circle-outline" size={16} color={C.info} />
              <Text style={[T.label, { color: C.text }]}>If you cancel</Text>
            </View>
            <Text style={subscriptionStyles.infoText}>
              Premium stays active until the end of your current billing period. After that,
              your account moves to the free plan automatically — no extra charges.
            </Text>
          </View>
        )}

        <View style={showCancel ? styles.blockSpaced : undefined}>
          <View style={styles.blockHeader}>
            <Ionicons name="lock-open-outline" size={16} color={C.text2} />
            <Text style={[T.label, { color: C.text }]}>Free plan includes</Text>
          </View>
          {FREE_PLAN_LIMITS.map((limit, i) => (
            <View key={i} style={styles.limitRow}>
              <View style={styles.bullet} />
              <Text style={[subscriptionStyles.infoText, { flex: 1 }]}>{limit}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...E.card, borderRadius: R.xl, padding: LAYOUT.cardPad },
  blockSpaced: {
    marginTop: S.base,
    paddingTop: S.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  limitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginTop: 6 },
  bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.text3, marginTop: 8 },
});
