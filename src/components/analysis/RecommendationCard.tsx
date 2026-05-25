import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImprovementPlanItem } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { ExerciseIllustration, getMuscleExerciseType } from '../body/ExerciseIllustration';

interface RecommendationCardProps {
  item: ImprovementPlanItem;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  const isHighPriority = item.priority <= 2;
  const dotColor = isHighPriority ? COLORS.red : item.priority <= 4 ? COLORS.amber : COLORS.accent;
  const exerciseType = getMuscleExerciseType(item.area.toLowerCase());

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {/* Illustration thumbnail */}
        <View style={[styles.illustrationWrap, { borderColor: dotColor + '28' }]}>
          <ExerciseIllustration type={exerciseType} color={dotColor} size={54} />
        </View>

        {/* Priority + title */}
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={[styles.priorityBadge, { backgroundColor: dotColor + '14', borderColor: dotColor + '30' }]}>
              <Text style={[styles.priorityNum, { color: dotColor }]}>{item.priority}</Text>
            </View>
            <Text style={styles.area} numberOfLines={1}>{item.area}</Text>
          </View>
          <View style={styles.timeframeRow}>
            <Ionicons name="time-outline" size={11} color={COLORS.text.disabled} />
            <Text style={styles.timeframe}>{item.timeframe}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.action}>{item.action}</Text>
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Expected: </Text>
        <Text style={styles.resultText}>{item.expectedResult}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  illustrationWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priorityBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  priorityNum: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.display,
  },
  area: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    flex: 1,
  },
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeframe: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
  },
  action: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.6,
    marginBottom: SPACING.sm,
  },
  resultRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resultLabel: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  resultText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
  },
});
