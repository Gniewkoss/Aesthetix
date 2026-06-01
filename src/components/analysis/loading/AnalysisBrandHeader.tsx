import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AesthetixLogo } from '../../brand/AesthetixLogo';
import { C, T, S } from '../../../theme/obsidian';
import { APP_BRAND } from './constants';

interface AnalysisBrandHeaderProps {
  topInset: number;
}

export function AnalysisBrandHeader({ topInset }: AnalysisBrandHeaderProps) {
  return (
    <View style={[styles.wrap, { paddingTop: topInset + S.lg }]}>
      <AesthetixLogo variant="wordmark" width={120} color={C.text} />
      <Text style={[T.overline, styles.tagline]}>{APP_BRAND.tagline.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingBottom: S.lg,
    gap: S.sm,
    zIndex: 2,
    backgroundColor: C.canvas,
  },
  tagline: { color: C.text3 },
});
