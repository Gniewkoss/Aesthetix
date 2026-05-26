import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';
import { SPRING_PRESS, SCALE_PRESS_IN, SCALE_PRESS_OUT } from '../../motion';

// ─── Variant × Size configuration ─────────────────────────────────────────────
// Mirrors shadcn/ui variant system, adapted to React Native dark theme.

export type ButtonVariant =
  | 'default'       // accent blue — primary CTA
  | 'secondary'     // subtle fill — secondary action
  | 'destructive'   // red — danger actions
  | 'outline'       // border only — tertiary
  | 'ghost'         // no bg/border — contextual
  | 'link'          // text only — inline action
  | 'brand';        // cream diagonal — brand moments

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  haptics?: boolean;
  accessibilityLabel?: string;
}

// ── Gradient configs for variants that use gradient fills ─────────────────────
const DIAG = { start: { x: 0.1, y: 0.9 }, end: { x: 0.9, y: 0.1 } };
const VERT = { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };

type VariantStyle = {
  gradient?: readonly [string, string];
  gradientDir?: typeof DIAG;
  bg?: string;
  border?: string;
  text: string;
};

const VARIANT_STYLES: Record<ButtonVariant, VariantStyle> = {
  default:     { gradient: ['#2563EB', '#1D4ED8'], gradientDir: VERT, text: '#ffffff' },
  secondary:   { bg: COLORS.bg.elevated, border: COLORS.border.default, text: COLORS.text.secondary },
  destructive: { gradient: ['#EF4444', '#DC2626'], gradientDir: VERT, text: '#ffffff' },
  outline:     { bg: 'transparent', border: COLORS.border.default, text: COLORS.cream },
  ghost:       { bg: 'transparent', text: COLORS.text.secondary },
  link:        { bg: 'transparent', text: COLORS.accent },
  brand:       { gradient: ['#ECECE6', '#D0D0CA'], gradientDir: DIAG, text: COLORS.bg.primary },
};

const SIZE_STYLES: Record<ButtonSize, { height: number; px: number; fontSize: number; iconSize: number }> = {
  sm:   { height: 36, px: SPACING.base,  fontSize: FONTS.sizes.sm,   iconSize: 14 },
  md:   { height: 46, px: SPACING.xl,    fontSize: FONTS.sizes.base,  iconSize: 16 },
  lg:   { height: 54, px: SPACING['2xl'], fontSize: FONTS.sizes.base, iconSize: 18 },
  icon: { height: 40, px: 0,              fontSize: FONTS.sizes.base,  iconSize: 18 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  leadingIcon,
  trailingIcon,
  haptics = true,
  accessibilityLabel,
}: ButtonProps) {
  const vs = VARIANT_STYLES[variant];
  const ss = SIZE_STYLES[size];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.42 : 1,
  }));

  const handlePressIn  = () => { scale.value = withSpring(SCALE_PRESS_IN,  SPRING_PRESS); };
  const handlePressOut = () => { scale.value = withSpring(SCALE_PRESS_OUT, SPRING_PRESS); };
  const handlePress    = () => {
    if (haptics && variant !== 'ghost' && variant !== 'link') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const isLink = variant === 'link';

  const content = loading ? (
    <ActivityIndicator color={vs.text} size="small" />
  ) : (
    <View style={styles.inner}>
      {leadingIcon && <View style={styles.iconSlot}>{leadingIcon}</View>}
      <Text style={[
        styles.label,
        { color: vs.text, fontSize: ss.fontSize },
        isLink && styles.labelLink,
      ]}>
        {children}
      </Text>
      {trailingIcon && <View style={styles.iconSlot}>{trailingIcon}</View>}
    </View>
  );

  const containerStyle: ViewStyle[] = [
    { height: size === 'icon' ? ss.height : ss.height, paddingHorizontal: size === 'icon' ? ss.height / 2 : ss.px },
    styles.container,
  ];

  // Link variant — text only, no container decoration
  if (isLink) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[animStyle, styles.linkContainer, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  // Gradient variants
  if (vs.gradient) {
    return (
      <Animated.View style={[animStyle, styles.shadow, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <LinearGradient
            colors={vs.gradient}
            start={vs.gradientDir?.start ?? VERT.start}
            end={vs.gradientDir?.end ?? VERT.end}
            style={containerStyle}
          >
            {content}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  // Flat variants (secondary, outline, ghost)
  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        animStyle,
        containerStyle,
        vs.bg !== undefined ? { backgroundColor: vs.bg } : undefined,
        vs.border ? { borderWidth: 1, borderColor: vs.border } : undefined,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  linkContainer: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconSlot: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.label,
  },
  labelLink: {
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.accent,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
});
