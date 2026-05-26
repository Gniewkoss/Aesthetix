import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

interface StatPillProps {
  label: string;
  value: string | number;
  color?: string;
  style?: ViewStyle;
}

export function StatPill({ label, value, color = COLORS.accent, style }: StatPillProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  value: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
