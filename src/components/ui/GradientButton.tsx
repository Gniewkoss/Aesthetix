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
import { SPRING_PRESS, SCALE_PRESS_IN, SCALE_PRESS_OUT } from '../../motion';

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
  colors: readonly [string, string];
  textColor: string;
  borderColor?: string;
};

// Brand variant: diagonal blade sweep (135°) — matches the logo mark geometry.
// All other variants: minimal vertical gradient for subtle depth, no glow.
const DIAGONAL = { start: { x: 0.1, y: 0.9 }, end: { x: 0.9, y: 0.1 } };
const VERTICAL  = { start: { x: 0, y: 0 },   end: { x: 0, y: 1 } };

const BUTTON_CONFIGS: Record<string, VariantConfig> = {
  primary:   { colors: ['#2563EB', '#1D4ED8'],  textColor: '#FFFFFF' },
  secondary: { colors: ['#4F46E5', '#4338CA'],  textColor: '#FFFFFF' },
  danger:    { colors: ['#EF4444', '#DC2626'],  textColor: '#FFFFFF' },
  outline:   { colors: ['transparent', 'transparent'], textColor: COLORS.cream, borderColor: COLORS.border.default },
  brand:     { colors: ['#ECECE6', '#D0D0CA'],  textColor: '#060609' },
};

const SIZES = {
  sm: { height: 44, fontSize: FONTS.sizes.sm,  paddingH: SPACING.base },
  md: { height: 52, fontSize: FONTS.sizes.base, paddingH: SPACING.xl   },
  lg: { height: 58, fontSize: FONTS.sizes.base, paddingH: SPACING['2xl'] },
};

// Subtle base shadow: elevation without AI glow
const BASE_SHADOW: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.22,
  shadowRadius: 6,
  elevation: 4,
};

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
  const { colors, textColor, borderColor } = BUTTON_CONFIGS[variant];
  const isOutline = variant === 'outline';
  const isBrand   = variant === 'brand';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(SCALE_PRESS_IN,  SPRING_PRESS); };
  const handlePressOut = () => { scale.value = withSpring(SCALE_PRESS_OUT, SPRING_PRESS); };
  const handlePress    = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const shadow = (isOutline || disabled) ? {} : BASE_SHADOW;
  const gradientDir = isBrand ? DIAGONAL : VERTICAL;

  return (
    <Animated.View style={[animStyle, shadow, { opacity: disabled ? 0.40 : 1 }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={colors}
          start={gradientDir.start}
          end={gradientDir.end}
          style={[
            styles.button,
            { height, paddingHorizontal: paddingH },
            isOutline && borderColor ? { borderWidth: 1, borderColor } : null,
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
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
