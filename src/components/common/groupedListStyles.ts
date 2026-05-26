import { StyleSheet } from 'react-native';
import { LAYOUT, SPACING } from '../../theme';

/** Horizontal inset for rows inside a grouped GlassCard (padding={0}) */
export const GROUPED_ROW_PAD = {
  paddingHorizontal: SPACING.base,
} as const;

export const groupedListStyles = StyleSheet.create({
  rowPad: GROUPED_ROW_PAD,
});
