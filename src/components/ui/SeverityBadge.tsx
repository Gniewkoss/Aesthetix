import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

type Severity = 'low' | 'medium' | 'high';

interface SeverityBadgeProps {
  severity: Severity;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  low: { label: 'LOW', color: COLORS.green, bg: COLORS.greenDim },
  medium: { label: 'MEDIUM', color: COLORS.orange, bg: COLORS.orangeDim },
  high: { label: 'HIGH', color: COLORS.pink, bg: COLORS.pinkDim },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { label, color, bg } = SEVERITY_CONFIG[severity];
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '40' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 1,
  },
});
