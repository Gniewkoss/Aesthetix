import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../theme';

interface InfoRowProps {
  title: string;
  subtitle?: string;
  extraText?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  showBorder?: boolean;
  titleStyle?: object;
}

export function InfoRow({
  title,
  subtitle,
  extraText,
  leftContent,
  rightContent,
  onPress,
  showBorder = false,
  titleStyle,
}: InfoRowProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.75 } : {};

  return (
    <Wrapper {...(wrapperProps as any)} style={[styles.row, showBorder && styles.border]}>
      {leftContent && <View style={styles.left}>{leftContent}</View>}
      <View style={styles.center}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {extraText ? <Text style={styles.extraText}>{extraText}</Text> : null}
      </View>
      {rightContent && <View style={styles.rightSlot}>{rightContent}</View>}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 14,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.hairline,
  },
  left: {
    flexShrink: 0,
  },
  rightSlot: {
    flexShrink: 0,
  },
  center: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
    lineHeight: FONTS.sizes.xs * 1.45,
  },
  extraText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
    marginTop: 4,
  },
});
