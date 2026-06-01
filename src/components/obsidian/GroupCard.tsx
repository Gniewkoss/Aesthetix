import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { C, T, R, S, LAYOUT, E } from '../../theme/obsidian';

interface GroupCardProps {
  label?: string;
  children: React.ReactNode;
  /** `card` matches stacked card spacing; `section` adds larger gap (default). */
  spacing?: 'section' | 'card';
  /** Remove inner clipping/padding so children manage their own layout. */
  style?: StyleProp<ViewStyle>;
}

/** Optional eyebrow label + a grouped surface card that clips row borders. */
export function GroupCard({ label, children, spacing = 'section', style }: GroupCardProps) {
  return (
    <View style={[styles.section, spacing === 'card' && styles.sectionCard]}>
      {label ? <Text style={[T.overline, styles.label]}>{label}</Text> : null}
      <View style={[styles.card, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: LAYOUT.sectionGap },
  sectionCard: { marginBottom: LAYOUT.cardGap },
  label: { color: C.text3, marginBottom: S.md },
  card: {
    ...E.card,
    borderRadius: R.xl,
    overflow: 'hidden',
  },
});
