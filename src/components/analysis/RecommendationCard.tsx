import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImprovementPlanItem } from '../../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

interface RecommendationCardProps {
  item: ImprovementPlanItem;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  const priorityColor = item.priority <= 2 ? COLORS.pink : item.priority <= 4 ? COLORS.orange : COLORS.cyan;

  return (
    <LinearGradient
      colors={['rgba(0,245,255,0.05)', 'rgba(123,47,190,0.03)']}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20', borderColor: priorityColor + '50' }]}>
          <Text style={[styles.priorityNum, { color: priorityColor }]}>#{item.priority}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <Text style={styles.area}>{item.area}</Text>
          <Text style={styles.timeframe}>⏱ {item.timeframe}</Text>
        </View>
      </View>
      <Text style={styles.action}>{item.action}</Text>
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Expected: </Text>
        <Text style={styles.resultText}>{item.expectedResult}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.12)',
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priorityBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNum: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.black,
  },
  area: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
  },
  timeframe: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  action: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: FONTS.sizes.sm * 1.6,
    marginBottom: SPACING.sm,
  },
  resultRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resultLabel: {
    color: COLORS.cyan,
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
  },
  resultText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.xs,
    flex: 1,
  },
});
