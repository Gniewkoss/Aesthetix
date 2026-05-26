import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AesthetixLogo } from '../../brand/AesthetixLogo';
import { COLORS, FONT_FAMILY, FONTS, SPACING, TRACKING } from '../../../theme';
import { APP_BRAND } from './constants';

interface AnalysisBrandHeaderProps {
  topInset: number;
}

export function AnalysisBrandHeader({ topInset }: AnalysisBrandHeaderProps) {
  return (
    <View style={[styles.wrap, { paddingTop: topInset + SPACING.lg }]}>
      <AesthetixLogo variant="wordmark" width={120} color={COLORS.cream} />
      <Text style={styles.tagline}>{APP_BRAND.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
    zIndex: 2,
    backgroundColor: COLORS.bg.primary,
  },
  tagline: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.label,
  },
});
