import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  iconColor?: string;
  right?: React.ReactNode;
}

/** shadcn CardHeader-style row with optional tinted icon box */
export function SectionHeader({
  title,
  icon,
  iconColor = COLORS.accent,
  right,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '14', borderColor: iconColor + '28' }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  right: {
    flexShrink: 0,
  },
});
