import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

type Severity = 'low' | 'medium' | 'high';

interface SeverityBadgeProps {
  severity: Severity;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  low: { label: 'LOW', color: COLORS.green, bg: COLORS.greenDim },
  medium: { label: 'MED', color: COLORS.amber, bg: COLORS.amberDim },
  high: { label: 'HIGH', color: COLORS.red, bg: COLORS.redDim },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { label, color, bg } = SEVERITY_CONFIG[severity];
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '35' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 0.8,
  },
});
