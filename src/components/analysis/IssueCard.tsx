import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IssueDetected } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING } from '../../theme';
import { SeverityBadge } from '../ui/SeverityBadge';

type CategoryIconName = keyof typeof Ionicons.glyphMap;

const CATEGORY_ICONS: Record<string, CategoryIconName> = {
  proportion:  'resize-outline',
  symmetry:    'git-compare-outline',
  posture:     'body-outline',
  composition: 'analytics-outline',
  balance:     'scale-outline',
};

// Severity → accent color for the left bar
const SEVERITY_COLORS: Record<string, string> = {
  high:   COLORS.red,
  medium: COLORS.amber,
  low:    COLORS.accent,
};

interface IssueCardProps {
  issue: IssueDetected;
}

export function IssueCard({ issue }: IssueCardProps) {
  const iconName   = CATEGORY_ICONS[issue.category] ?? 'warning-outline';
  const accentColor = SEVERITY_COLORS[issue.severity] ?? COLORS.amber;

  return (
    <View style={[styles.card, { borderColor: accentColor + '18' }]}>
      {/* Left accent bar — severity-coded, system-consistent */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Header: icon + title + severity badge */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: accentColor + '10', borderColor: accentColor + '25' }]}>
            <Ionicons name={iconName} size={13} color={accentColor} />
          </View>
          <Text style={styles.title} numberOfLines={2}>{issue.title}</Text>
          <SeverityBadge severity={issue.severity} />
        </View>

        {/* Description */}
        <Text style={styles.description}>{issue.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: LAYOUT.cardGap,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  // Left bar — same pattern as score hero card and tip card
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: SPACING.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  title: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.body,
  },
  description: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.6,
  },
});
