import React from 'react';
import { Text, ActivityIndicator, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, E } from '../../theme/obsidian';
import { PressableScale } from '../../screens/Dashboard/home/PressableScale';

type Variant = 'primary' | 'secondary' | 'outline' | 'destructive';
type Size = 'sm' | 'md';

interface ObsButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HEIGHTS: Record<Size, number> = { sm: 44, md: 52 };

export function ObsButton({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, glow = false, style,
}: ObsButtonProps) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptics={variant === 'primary'}
      accessibilityLabel={title}
      style={[
        styles.base,
        { height: HEIGHTS[size], backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 },
        glow && variant === 'primary' ? E.glow : undefined,
        inactive && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={16} color={v.text} /> : null}
          <Text style={[T.label, { color: v.text, fontSize: 15 }]}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const VARIANTS: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:     { bg: C.volt, text: C.voltInk },
  secondary:   { bg: C.surface2, text: C.text, border: C.borderMd },
  outline:     { bg: 'transparent', text: C.text2, border: C.borderMd },
  destructive: { bg: 'rgba(255,92,92,0.10)', text: C.danger, border: 'rgba(255,92,92,0.28)' },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
});
