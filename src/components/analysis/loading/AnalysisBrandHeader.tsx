import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../../theme';
import { APP_BRAND } from './constants';

interface AnalysisBrandHeaderProps {
  topInset: number;
}

export function AnalysisBrandHeader({ topInset }: AnalysisBrandHeaderProps) {
  return (
    <View style={[styles.wrap, { paddingTop: topInset + SPACING.xl }]}>
      <View style={styles.logoIcon}>
        <Ionicons name="scan" size={24} color={COLORS.accent} />
      </View>
      <Text style={styles.name}>{APP_BRAND.name}</Text>
      <Text style={styles.tagline}>{APP_BRAND.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONTS.sizes['2xl'],
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    marginTop: SPACING.xs,
  },
});
