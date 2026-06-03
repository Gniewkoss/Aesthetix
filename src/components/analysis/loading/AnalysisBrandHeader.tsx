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
    <View style={[styles.wrap, { paddingTop: topInset + S.md }]}>
      <AesthetixLogo variant="wordmark" width={156} color={C.text} />
      <Text style={styles.tagline}>{APP_BRAND.tagline.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingBottom: S.sm,
    gap: S.xs,
    zIndex: 2,
  },
  tagline: {
    ...T.overline,
    color: C.text3,
    letterSpacing: 1.4,
    marginTop: 2,
  },
});
