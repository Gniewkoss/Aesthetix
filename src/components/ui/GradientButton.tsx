import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
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

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  /** Leading icon (shown before title) */
  icon?: React.ReactNode;
  /** Trailing icon (shown after title, e.g. arrow-forward) */
  trailingIcon?: React.ReactNode;
}

type VariantConfig = {
  colors: [string, string];
  glowColor: string | null;
};

const BUTTON_CONFIGS: Record<string, VariantConfig> = {
  primary:   { colors: ['#1D4ED8', '#3B82F6'],     glowColor: '#3B82F6' },
  secondary: { colors: ['#6D28D9', '#7C3AED'],     glowColor: '#7C3AED' },
  danger:    { colors: ['#B91C1C', '#EF4444'],     glowColor: '#EF4444' },
  outline:   { colors: ['transparent', 'transparent'], glowColor: null },
};

const SIZES = {
  sm: { height: 44, fontSize: FONTS.sizes.sm,  paddingH: SPACING.base },
  md: { height: 52, fontSize: FONTS.sizes.base, paddingH: SPACING.xl   },
  lg: { height: 58, fontSize: FONTS.sizes.base, paddingH: SPACING['2xl'] },
};

// Tighter spring = snappier press, still feels physical
const SPRING = { damping: 18, stiffness: 500, mass: 0.6 };

export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  icon,
  trailingIcon,
}: GradientButtonProps) {
  const { height, fontSize, paddingH } = SIZES[size];
  const { colors, glowColor } = BUTTON_CONFIGS[variant];
  const isOutline = variant === 'outline';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SPRING);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1.0, SPRING);
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Glow shadow applied to the outer wrapper so it renders under the button
  const glowShadow: ViewStyle = glowColor && !isOutline && !disabled
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.32,
        shadowRadius: 16,
        elevation: 10,
      }
    : {};

  return (
    <Animated.View style={[animStyle, glowShadow, { opacity: disabled ? 0.45 : 1 }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            { height, paddingHorizontal: paddingH },
            isOutline && styles.outlineBorder,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text.primary} size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <View style={styles.leadingIcon}>{icon}</View>}
              <Text style={[styles.text, { fontSize }]}>{title}</Text>
              {trailingIcon && <View style={styles.trailingIcon}>{trailingIcon}</View>}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadingIcon: {},
  trailingIcon: {},
  text: {
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.label,
  },
});
