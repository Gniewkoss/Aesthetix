import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEDICAL_DISCLAIMER } from '../constants/legal';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../theme';

/**
 * Prominent "not medical advice" notice. Render on signup and on analysis results
 * to keep the product framed as fitness/wellness rather than a medical device.
 */
export function MedicalDisclaimer({
  style,
  compact = false,
}: {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="text"
      accessibilityLabel={MEDICAL_DISCLAIMER}
    >
      <Ionicons name="information-circle-outline" size={14} color={COLORS.text.muted} />
      <Text style={[styles.text, compact && styles.textCompact]}>{MEDICAL_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  text: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    lineHeight: FONTS.sizes.xs * 1.5,
  },
  textCompact: {
    lineHeight: FONTS.sizes.xs * 1.4,
  },
});
