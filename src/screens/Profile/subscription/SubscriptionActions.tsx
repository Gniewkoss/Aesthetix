import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GradientButton } from '../../../components/ui/GradientButton';
import { SPACING } from '../../../theme';

interface SubscriptionActionsProps {
  showChangePlan: boolean;
  showReactivate: boolean;
  loading?: boolean;
  onChangePlan: () => void;
  onManagePayment: () => void;
  onReactivate?: () => void;
}

export function SubscriptionActions({
  showChangePlan,
  showReactivate,
  loading,
  onChangePlan,
  onManagePayment,
  onReactivate,
}: SubscriptionActionsProps) {
  return (
    <View style={styles.wrap}>
      {showChangePlan && (
        <GradientButton
          title="Change plan"
          onPress={onChangePlan}
          variant="secondary"
          size="md"
          disabled={loading}
          style={styles.btn}
        />
      )}
      {showReactivate && onReactivate && (
        <GradientButton
          title="Turn auto-renew back on"
          onPress={onReactivate}
          loading={loading}
          variant="secondary"
          size="md"
          style={styles.btn}
        />
      )}
      <GradientButton
        title="Manage payment"
        onPress={onManagePayment}
        variant="outline"
        size="md"
        disabled={loading}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACING.lg, gap: SPACING.sm },
  btn: { width: '100%' },
});
