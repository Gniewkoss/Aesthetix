import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

interface StatPillProps {
  label: string;
  value: string | number;
  color?: string;
  style?: ViewStyle;
}

export function StatPill({ label, value, color = COLORS.cyan, style }: StatPillProps) {
  return (
    <View style={[styles.container, { borderColor: color + '30' }, style]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  value: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontWeight: FONTS.weights.medium,
    marginTop: 2,
    textAlign: 'center',
  },
});
