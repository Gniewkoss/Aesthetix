import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

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

const GRADIENTS = {
  primary: ['#7B2FBE', '#00F5FF'] as [string, string],
  secondary: ['#FF006E', '#7B2FBE'] as [string, string],
  danger: ['#FF006E', '#FF6B00'] as [string, string],
  outline: ['transparent', 'transparent'] as [string, string],
};

const SIZES = {
  sm: { height: 44, fontSize: FONTS.sizes.sm, paddingH: SPACING.base },
  md: { height: 54, fontSize: FONTS.sizes.base, paddingH: SPACING.xl },
  lg: { height: 62, fontSize: FONTS.sizes.md, paddingH: SPACING['2xl'] },
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
}: GradientButtonProps) {
  const { height, fontSize, paddingH } = SIZES[size];
  const isOutline = variant === 'outline';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={GRADIENTS[variant]}
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
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
  },
  text: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0.5,
  },
});
