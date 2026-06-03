import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, R } from '../../theme/obsidian';

export const OBS_CLOSE_SIZE = 40;

interface ObsCloseButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Close control — matches Upload / Capture Studio header button exactly. */
export function ObsCloseButton({ onPress, style }: ObsCloseButtonProps) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={[styles.close, style]}
    >
      <Ionicons name="close" size={20} color={C.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: {
    width: OBS_CLOSE_SIZE,
    height: OBS_CLOSE_SIZE,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
});
