import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IssueDetected } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { SeverityBadge } from '../ui/SeverityBadge';

type CategoryIconName = keyof typeof Ionicons.glyphMap;

const CATEGORY_ICONS: Record<string, CategoryIconName> = {
  proportion: 'resize-outline',
  symmetry: 'git-compare-outline',
  posture: 'body-outline',
  composition: 'analytics-outline',
  balance: 'scale-outline',
};

interface IssueCardProps {
  issue: IssueDetected;
}

export function IssueCard({ issue }: IssueCardProps) {
  const iconName = CATEGORY_ICONS[issue.category] ?? 'warning-outline';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={14} color={COLORS.amber} />
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.title}>{issue.title}</Text>
        </View>
        <SeverityBadge severity={issue.severity} />
      </View>
      <Text style={styles.description}>{issue.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.14)',
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.amberDim,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  description: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.6,
  },
});
