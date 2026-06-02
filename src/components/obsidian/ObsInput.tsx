import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S } from '../../theme/obsidian';

interface ObsInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export function ObsInput({
  label, error, hint, leftIcon, isPassword, secureTextEntry, containerStyle, ...props
}: ObsInputProps) {
  const [show, setShow] = useState(false);
  const focus = useSharedValue(0);
  const hasError = !!error;
  const secure = isPassword || secureTextEntry;

  const wrapStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value, [0, 1],
      [hasError ? 'rgba(255,92,92,0.4)' : C.border, hasError ? C.danger : C.voltBorder],
    ),
    backgroundColor: interpolateColor(
      focus.value, [0, 1],
      [C.surface2, hasError ? 'rgba(255,92,92,0.06)' : C.voltDim],
    ),
  }));

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={[T.label, styles.label]}>{label}</Text> : null}

      <Animated.View style={[styles.wrap, wrapStyle]}>
        {leftIcon ? <Ionicons name={leftIcon} size={16} color={C.text3} style={styles.leftIcon} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={C.text3}
          onFocus={() => { focus.value = withTiming(1, { duration: 160 }); }}
          onBlur={() => { focus.value = withTiming(0, { duration: 200 }); }}
          secureTextEntry={secure && !show}
          accessibilityHint={error ?? hint}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={8} style={styles.eye}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color={C.text3} />
          </Pressable>
        ) : null}
      </Animated.View>

      {error ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle-outline" size={12} color={C.danger} />
          <Text style={[T.caption, { color: C.danger }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[T.caption, { color: C.text3, marginTop: 5 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: S.base },
  label: { color: C.text2, marginBottom: 7 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: R.md,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: S.base,
  },
  leftIcon: { marginRight: S.sm, opacity: 0.8 },
  input: {
    flex: 1,
    color: C.text,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eye: { paddingLeft: S.sm },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
});
