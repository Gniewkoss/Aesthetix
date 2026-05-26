import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

// ─── Input — shadcn/ui Input with animated focus + label ─────────────────────
// Supports: label, error state, hint text, left/right icon slots, password toggle

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  isPassword = false,
  secureTextEntry,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const focus = useSharedValue(0);

  const hasError = Boolean(error);
  const isSecure = isPassword || secureTextEntry;

  const wrapStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [
        hasError ? COLORS.redBorder : COLORS.border.subtle,
        hasError ? COLORS.red       : 'rgba(59,130,246,0.45)',
      ],
    ),
    backgroundColor: interpolateColor(
      focus.value,
      [0, 1],
      [
        COLORS.bg.secondary,
        hasError ? 'rgba(239,68,68,0.05)' : 'rgba(59,130,246,0.05)',
      ],
    ),
  }));

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <Animated.View style={[styles.wrap, wrapStyle]}>
        {leftIcon ? (
          <View style={styles.iconSlot}>{leftIcon}</View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            leftIcon  ? styles.inputWithLeft  : undefined,
            (rightIcon || isSecure) ? styles.inputWithRight : undefined,
          ]}
          placeholderTextColor={COLORS.text.disabled}
          onFocus={() => { focus.value = withTiming(1, { duration: 160 }); }}
          onBlur={()  => { focus.value = withTiming(0, { duration: 200 }); }}
          secureTextEntry={isSecure && !showPassword}
          accessibilityHint={error ?? hint}
          {...props}
        />

        {isSecure ? (
          <TouchableOpacity
            style={styles.iconSlot}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={COLORS.text.muted}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconSlot}>{rightIcon}</View>
        ) : null}
      </Animated.View>

      {error ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle-outline" size={12} color={COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.secondary,
    marginBottom: 7,
    letterSpacing: TRACKING.label,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: SPACING.base,
  },
  iconSlot: {
    flexShrink: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.55,
  },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.body,
    height: '100%',
    paddingVertical: 0,
  },
  inputWithLeft:  { marginLeft:  SPACING.sm },
  inputWithRight: { marginRight: SPACING.sm },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.red,
  },
  hintText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 5,
  },
});
