import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

const LEGEND_ITEMS = [
  { color: '#22C55E', label: 'Strong',      range: '80–100' },
  { color: '#84CC16', label: 'Good',        range: '65–79' },
  { color: '#EAB308', label: 'Average',     range: '50–64' },
  { color: '#F97316', label: 'Needs work',  range: '35–49' },
  { color: '#EF4444', label: 'Weak',        range: '0–34'  },
] as const;

interface MuscleLegendProps {
  compact?: boolean;
}

export function MuscleLegend({ compact = false }: MuscleLegendProps) {
  if (compact) {
    return (
      <View style={styles.compactRow}>
        {LEGEND_ITEMS.map((item) => (
          <View key={item.label} style={styles.compactItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.compactLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>MUSCLE SCORE LEGEND</Text>
      {LEGEND_ITEMS.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowRange}>{item.range}</Text>
        </View>
      ))}
      <View style={styles.notVisibleRow}>
        <View style={[styles.swatch, { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }]} />
        <Text style={[styles.rowLabel, { color: COLORS.text.disabled }]}>Not visible</Text>
        <Text style={[styles.rowRange, { color: COLORS.text.disabled }]}>—</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: 1.4,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  notVisibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  rowLabel: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
  },
  rowRange: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    minWidth: 44,
    textAlign: 'right',
  },

  // Compact row variant
  compactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  compactLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
});
