import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

// ─── Badge — shadcn/ui Badge adapted to React Native ─────────────────────────
// Variants align with shadcn: default | secondary | destructive | outline
// Extended with: success | warning for status use-cases

export type BadgeVariant =
  | 'default'       // accent blue fill
  | 'secondary'     // subtle grey fill
  | 'destructive'   // red fill
  | 'outline'       // border only, no fill
  | 'success'       // green fill
  | 'warning';      // amber fill

export type BadgeSize = 'sm' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  leadingDot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

type BadgeConfig = { bg: string; text: string; border?: string };

const VARIANT_CONFIG: Record<BadgeVariant, BadgeConfig> = {
  default:     { bg: COLORS.accentDim,  text: COLORS.accent,          border: COLORS.accentBorder  },
  secondary:   { bg: COLORS.glass.bg,   text: COLORS.text.secondary,  border: COLORS.border.subtle },
  destructive: { bg: COLORS.redDim,     text: COLORS.red,             border: COLORS.redBorder     },
  outline:     { bg: 'transparent',     text: COLORS.text.secondary,  border: COLORS.border.default },
  success:     { bg: COLORS.greenDim,   text: COLORS.green,           border: COLORS.greenBorder   },
  warning:     { bg: COLORS.amberDim,   text: COLORS.amber,           border: COLORS.amberBorder   },
};

const SIZE_CONFIG = {
  sm:      { px: 6,          py: 3,          fontSize: 10, radius: RADIUS.xs },
  default: { px: SPACING.sm, py: SPACING.xs, fontSize: FONTS.sizes.xs, radius: RADIUS.xs },
};

export function Badge({
  children,
  variant = 'default',
  size = 'default',
  leadingDot = false,
  style,
  textStyle,
}: BadgeProps) {
  const cfg = VARIANT_CONFIG[variant];
  const sz  = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          paddingHorizontal: sz.px,
          paddingVertical: sz.py,
          borderRadius: sz.radius,
        },
        cfg.border ? { borderWidth: 1, borderColor: cfg.border } : undefined,
        style,
      ]}
    >
      {leadingDot && (
        <View style={[styles.dot, { backgroundColor: cfg.text }]} />
      )}
      <Text style={[styles.label, { color: cfg.text, fontSize: sz.fontSize }, textStyle]}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
  },
});
