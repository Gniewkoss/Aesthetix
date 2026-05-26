import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../theme';

export interface MetricItem {
  label: string;
  value: string | number;
  color?: string;
}

interface MetricGridProps {
  items: MetricItem[];
}

/** shadcn / SaaS dashboard — inline metric row with hairline dividers */
export function MetricGrid({ items }: MetricGridProps) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={styles.divider} />}
          <View style={styles.cell}>
            <Text style={[styles.value, item.color ? { color: item.color } : null]}>
              {item.value}
            </Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: COLORS.border.hairline,
  },
  value: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
});
