import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
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
  icon?: React.ReactNode;
}

const BUTTON_CONFIGS = {
  primary:   { colors: ['#1D4ED8', '#3B82F6'] as [string, string] },
  secondary: { colors: ['#6D28D9', '#7C3AED'] as [string, string] },
  danger:    { colors: ['#B91C1C', '#EF4444'] as [string, string] },
  outline:   { colors: ['transparent', 'transparent'] as [string, string] },
};

const SIZES = {
  sm: { height: 44, fontSize: FONTS.sizes.sm, paddingH: SPACING.base },
  md: { height: 52, fontSize: FONTS.sizes.base, paddingH: SPACING.xl },
  lg: { height: 58, fontSize: FONTS.sizes.base, paddingH: SPACING['2xl'] },
};

const SPRING = { damping: 14, stiffness: 400, mass: 0.8 };

export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  icon,
}: GradientButtonProps) {
  const { height, fontSize, paddingH } = SIZES[size];
  const { colors } = BUTTON_CONFIGS[variant];
  const isOutline = variant === 'outline';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.955, SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, SPRING);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[animStyle, { opacity: disabled ? 0.45 : 1 }, style]}>
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
            <>
              {icon && <>{icon}</>}
              <Text style={[styles.text, { fontSize, marginLeft: icon ? 8 : 0 }]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  text: {
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.label,
  },
});
