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
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

type VariantConfig = {
  colors: [string, string];
  glowColor: string | null;
  textColor: string;
};

// start bottom-left → end top-right mirrors the 135° mark blade direction
const DIAGONAL = { start: { x: 0.1, y: 0.9 }, end: { x: 0.9, y: 0.1 } };
const HORIZONTAL = { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };

const BUTTON_CONFIGS: Record<string, VariantConfig> = {
  primary:   { colors: ['#1E40AF', '#3B82F6'], glowColor: '#3B82F6', textColor: '#FFFFFF' },
  secondary: { colors: ['#4338CA', '#6366F1'], glowColor: '#6366F1', textColor: '#FFFFFF' },
  danger:    { colors: ['#B91C1C', '#EF4444'], glowColor: '#EF4444', textColor: '#FFFFFF' },
  outline:   { colors: ['transparent', 'transparent'], glowColor: null, textColor: '#FFFFFF' },
  // Brand variant — cream/off-white, the logo's own color, for hero moments
  brand:     { colors: ['#D8D8D2', '#ECECE6'], glowColor: '#ECECE6', textColor: '#060609' },
};

const SIZES = {
  sm: { height: 44, fontSize: FONTS.sizes.sm,  paddingH: SPACING.base },
  md: { height: 52, fontSize: FONTS.sizes.base, paddingH: SPACING.xl   },
  lg: { height: 58, fontSize: FONTS.sizes.base, paddingH: SPACING['2xl'] },
};

// Sharp, athletic spring — quick press response, minimal bounce
const SPRING = { damping: 20, stiffness: 600, mass: 0.5 };

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
  const { colors, glowColor, textColor } = BUTTON_CONFIGS[variant];
  const isOutline = variant === 'outline';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(0.96, SPRING); };
  const handlePressOut = () => { scale.value = withSpring(1.0, SPRING); };
  const handlePress    = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const glowShadow: ViewStyle =
    glowColor && !isOutline && !disabled
      ? {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: variant === 'brand' ? 0.20 : 0.32,
          shadowRadius: 18,
          elevation: 10,
        }
      : {};

  // Use diagonal gradient for brand, horizontal for others
  const gradientProps = variant === 'brand' ? DIAGONAL : HORIZONTAL;

  return (
    <Animated.View style={[animStyle, glowShadow, { opacity: disabled ? 0.42 : 1 }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={colors}
          start={gradientProps.start}
          end={gradientProps.end}
          style={[
            styles.button,
            { height, paddingHorizontal: paddingH },
            isOutline && styles.outlineBorder,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <View>{icon}</View>}
              <Text style={[styles.text, { fontSize, color: textColor }]}>{title}</Text>
              {trailingIcon && <View>{trailingIcon}</View>}
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
    borderColor: COLORS.border.default,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.label,
  },
});
