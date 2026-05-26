import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING, SHADOWS } from '../../theme';

// ─── Card family — shadcn/ui Card API adapted to React Native ─────────────────
// Usage:
//   <Card>
//     <CardHeader>
//       <CardTitle>Physique Score</CardTitle>
//       <CardDescription>Latest analysis</CardDescription>
//     </CardHeader>
//     <CardContent>...</CardContent>
//     <CardFooter>...</CardFooter>
//   </Card>
//
// Optional accent bar:
//   <Card accentColor={COLORS.accent}>  →  adds a 3px left bar, score-tier color

export type CardVariant = 'default' | 'elevated' | 'ghost' | 'inset';

// ── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  accentColor?: string;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', accentColor, style }: CardProps) {
  const vs = CARD_VARIANT_STYLES[variant];
  return (
    <View
      style={[
        styles.card,
        vs,
        accentColor ? { borderColor: accentColor + '18' } : undefined,
        style,
      ]}
    >
      {accentColor && (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      )}
      <View style={[styles.cardInner, accentColor ? { flex: 1 } : undefined]}>
        {children}
      </View>
    </View>
  );
}

// ── CardHeader ────────────────────────────────────────────────────────────────
interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  separator?: boolean;
}

export function CardHeader({ children, style, separator = false }: CardHeaderProps) {
  return (
    <View style={[styles.header, separator && styles.headerSeparator, style]}>
      {children}
    </View>
  );
}

// ── CardTitle ─────────────────────────────────────────────────────────────────
interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
  size?: 'sm' | 'default' | 'lg';
}

export function CardTitle({ children, style, size = 'default' }: CardTitleProps) {
  return (
    <Text style={[styles.title, TITLE_SIZES[size], style]}>
      {children}
    </Text>
  );
}

// ── CardDescription ───────────────────────────────────────────────────────────
interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
}

// ── CardContent ───────────────────────────────────────────────────────────────
interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPad?: boolean;
}

export function CardContent({ children, style, noPad = false }: CardContentProps) {
  return (
    <View style={[noPad ? undefined : styles.content, style]}>
      {children}
    </View>
  );
}

// ── CardFooter ────────────────────────────────────────────────────────────────
interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
  separator?: boolean;
}

export function CardFooter({ children, style, separator = false }: CardFooterProps) {
  return (
    <View style={[styles.footer, separator && styles.footerSeparator, style]}>
      {children}
    </View>
  );
}

// ── Eyebrow label — small caps label above section headers ────────────────────
interface CardEyebrowProps {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
}

export function CardEyebrow({ children, color, style }: CardEyebrowProps) {
  return (
    <Text style={[styles.eyebrow, color ? { color } : undefined, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: COLORS.bg.card,
    borderColor: COLORS.border.subtle,
  },
  elevated: {
    backgroundColor: COLORS.bg.elevated,
    borderColor: COLORS.border.subtle,
  },
  ghost: {
    backgroundColor: COLORS.glass.bg,
    borderColor: COLORS.border.hairline,
  },
  inset: {
    backgroundColor: COLORS.bg.secondary,
    borderColor: COLORS.border.hairline,
  },
};

const TITLE_SIZES: Record<'sm' | 'default' | 'lg', TextStyle> = {
  sm:      { fontSize: FONTS.sizes.sm,   lineHeight: FONTS.sizes.sm   * 1.4 },
  default: { fontSize: FONTS.sizes.base, lineHeight: FONTS.sizes.base * 1.4 },
  lg:      { fontSize: FONTS.sizes.lg,   lineHeight: FONTS.sizes.lg   * 1.3 },
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,                    // Refined: tighter radius
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: LAYOUT.cardGap,
    ...SHADOWS.card,                           // Apply soft elevation
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  cardInner: {
    flex: 1,
  },
  header: {
    padding: LAYOUT.cardPad,
    paddingBottom: SPACING.base,
    gap: SPACING.xs,
  },
  headerSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.hairline,
  },
  title: {
    fontFamily: FONT_FAMILY.bodySemibold,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  description: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,              // Improved: secondary instead of muted
    lineHeight: FONTS.sizes.sm * 1.5,
  },
  content: {
    padding: LAYOUT.cardPad,
    paddingTop: SPACING.sm,                    // Balanced spacing
  },
  footer: {
    padding: LAYOUT.cardPad,
    paddingTop: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footerSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.hairline,
  },
  eyebrow: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
    marginBottom: SPACING.xs,
  },
});
