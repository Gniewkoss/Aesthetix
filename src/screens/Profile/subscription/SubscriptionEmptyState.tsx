import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { TRIAL_DAYS } from '../../../subscription/subscription';
import { ObsButton } from '../../../components/obsidian/ObsButton';

interface SubscriptionEmptyStateProps {
  onStartTrial: () => void;
  onViewPlans: () => void;
  loading?: boolean;
}

export function SubscriptionEmptyState({ onStartTrial, onViewPlans, loading }: SubscriptionEmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={26} color={C.volt} />
      </View>
      <Text style={[T.title, { color: C.text, textAlign: 'center' }]}>Unlock Premium</Text>
      <Text style={[T.bodySm, { color: C.text2, textAlign: 'center', marginTop: S.sm, lineHeight: 21 }]}>
        Unlimited scans, full AI analysis, and progress tracking. Start with a {TRIAL_DAYS}-day free trial.
      </Text>
      <ObsButton title="Start free trial" onPress={onStartTrial} loading={loading} glow style={styles.btn} />
      <ObsButton title="Compare plans" onPress={onViewPlans} variant="outline" style={styles.btnSm} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    alignItems: 'center',
    marginTop: S.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: R.lg,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.base,
  },
  btn: { width: '100%', marginTop: S.lg },
  btnSm: { width: '100%', marginTop: S.sm },
});
