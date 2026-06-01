import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ObsButton } from '../../../components/obsidian/ObsButton';
import { S } from '../../../theme/obsidian';

interface CancelSubscriptionButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function CancelSubscriptionButton({ onPress, disabled, style }: CancelSubscriptionButtonProps) {
  return (
    <ObsButton
      title="Cancel subscription"
      onPress={onPress}
      variant="destructive"
      disabled={disabled}
      style={[{ width: '100%', marginTop: S.lg }, style]}
    />
  );
}
