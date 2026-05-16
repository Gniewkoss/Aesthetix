import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IssueDetected } from '../../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import { SeverityBadge } from '../ui/SeverityBadge';

const CATEGORY_ICONS: Record<string, string> = {
  proportion: '📐',
  symmetry: '⚖️',
  posture: '🦴',
  composition: '🔬',
  balance: '🎯',
};

interface IssueCardProps {
  issue: IssueDetected;
}

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <LinearGradient
      colors={['rgba(255,0,110,0.06)', 'rgba(255,107,0,0.03)']}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{CATEGORY_ICONS[issue.category] ?? '⚠️'}</Text>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.title}>{issue.title}</Text>
        </View>
        <SeverityBadge severity={issue.severity} />
      </View>
      <Text style={styles.description}>{issue.description}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,0,110,0.15)',
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 20,
    marginTop: 2,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
  },
  description: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: FONTS.sizes.sm * 1.6,
  },
});
