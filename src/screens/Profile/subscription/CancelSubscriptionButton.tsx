import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SPACING } from '../../../theme';
import { subscriptionStyles } from './subscriptionStyles';

interface CancelSubscriptionButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function CancelSubscriptionButton({ onPress, disabled }: CancelSubscriptionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.wrap}
      activeOpacity={0.7}
    >
      <Text style={[subscriptionStyles.destructiveLink, disabled && styles.disabled]}>
        Cancel subscription
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.sm,
  },
  disabled: { opacity: 0.4 },
});
