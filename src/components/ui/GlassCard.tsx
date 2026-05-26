import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  accentColor?: string; // Optional border color tint
}

export function GlassCard({ children, style, padding = SPACING.base, accentColor }: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        accentColor ? { borderColor: accentColor + '20' } : undefined,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Glassmorphic surface: frosted glass effect on dark background
    backgroundColor: COLORS.glass.bg,          // Translucent white (rgba 8%)
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,          // Subtle light border
    overflow: 'hidden',
    ...SHADOWS.card,                           // Soft elevation
  },
});
