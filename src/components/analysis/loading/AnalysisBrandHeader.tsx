import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AesthetixLogo } from '../../brand/AesthetixLogo';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../../theme';
import { APP_BRAND } from './constants';

interface AnalysisBrandHeaderProps {
  topInset: number;
}

export function AnalysisBrandHeader({ topInset }: AnalysisBrandHeaderProps) {
  return (
    <View style={[styles.wrap, { paddingTop: topInset + SPACING.xl }]}>
      <View style={styles.logoIcon}>
        <AesthetixLogo variant="mark" width={28} height={28} />
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
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: 'rgba(59,130,246,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  name: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONTS.sizes['2xl'],
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  tagline: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    marginTop: SPACING.xs,
    letterSpacing: 0.3,
  },
});
