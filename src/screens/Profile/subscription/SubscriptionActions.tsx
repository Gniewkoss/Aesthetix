import React from 'react';
import { View, StyleSheet } from 'react-native';
import { S, LAYOUT } from '../../../theme/obsidian';
import { ObsButton } from '../../../components/obsidian/ObsButton';

interface SubscriptionActionsProps {
  showChangePlan: boolean;
  showReactivate: boolean;
  loading?: boolean;
  onChangePlan: () => void;
  onManagePayment: () => void;
  onReactivate?: () => void;
}

export function SubscriptionActions({
  showChangePlan, showReactivate, loading, onChangePlan, onManagePayment, onReactivate,
}: SubscriptionActionsProps) {
  return (
    <View style={styles.wrap}>
      {showChangePlan && (
        <ObsButton title="Change plan" onPress={onChangePlan} variant="secondary" disabled={loading} />
      )}
      {showReactivate && onReactivate && (
        <ObsButton title="Turn auto-renew back on" onPress={onReactivate} variant="primary" loading={loading} />
      )}
      <ObsButton title="Manage payment" onPress={onManagePayment} variant="outline" disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: LAYOUT.sectionGap - S.md, gap: S.sm },
});
