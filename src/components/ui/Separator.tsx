import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, SPACING, TRACKING } from '../../theme';

// ─── Separator — shadcn/ui Separator adapted to React Native ──────────────────
// Supports: horizontal (default) and vertical orientations
// Optional label for "Or continue with" style dividers

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  style?: ViewStyle;
}

export function Separator({ orientation = 'horizontal', label, style }: SeparatorProps) {
  if (orientation === 'vertical') {
    return (
      <View style={[styles.vertical, style]} />
    );
  }

  if (label) {
    return (
      <View style={[styles.labelRow, style]}>
        <View style={styles.line} />
        <Text style={styles.labelText}>{label}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  return <View style={[styles.horizontal, style]} />;
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border.hairline,
    alignSelf: 'stretch',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border.hairline,
    alignSelf: 'stretch',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.base,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border.subtle,
  },
  labelText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.label,
  },
});
