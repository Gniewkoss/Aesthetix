import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  neonColor?: string;
  padding?: number;
}

export function GlassCard({ children, style, neonColor, padding = 16 }: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        neonColor ? { borderColor: neonColor + '30' } : undefined,
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
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    overflow: 'hidden',
  },
});
