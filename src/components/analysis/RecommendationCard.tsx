import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImprovementPlanItem } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING } from '../../theme';
import { ExerciseIllustration, getMuscleExerciseType } from '../body/ExerciseIllustration';

interface RecommendationCardProps {
  item: ImprovementPlanItem;
}

// Priority → accent color (same tier logic as score colors)
function getPriorityColor(priority: number): string {
  if (priority <= 2) return COLORS.red;
  if (priority <= 4) return COLORS.amber;
  return COLORS.accent;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  const accentColor  = getPriorityColor(item.priority);
  const exerciseType = getMuscleExerciseType(item.area.toLowerCase());

  return (
    <View style={[styles.card, { borderColor: accentColor + '18' }]}>
      {/* Left accent bar — priority-coded */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Header: illustration + priority badge + area + timeframe */}
        <View style={styles.header}>
          <View style={[styles.illustrationWrap, { borderColor: accentColor + '28' }]}>
            <ExerciseIllustration type={exerciseType} color={accentColor} size={54} />
          </View>

          <View style={styles.headerRight}>
            <View style={styles.headerTopRow}>
              {/* Priority number */}
              <View style={[styles.priorityBadge, { backgroundColor: accentColor + '12', borderColor: accentColor + '28' }]}>
                <Text style={[styles.priorityNum, { color: accentColor }]}>{item.priority}</Text>
              </View>
              <Text style={styles.area} numberOfLines={1}>{item.area}</Text>
            </View>

            <View style={styles.timeframeRow}>
              <Ionicons name="time-outline" size={11} color={COLORS.text.disabled} />
              <Text style={styles.timeframe}>{item.timeframe}</Text>
            </View>
          </View>
        </View>

        {/* Action text */}
        <Text style={styles.action}>{item.action}</Text>

        {/* Expected result */}
        <View style={styles.resultRow}>
          <Text style={[styles.resultLabel, { color: accentColor }]}>Expected: </Text>
          <Text style={styles.resultText}>{item.expectedResult}</Text>
        </View>
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
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  illustrationWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  headerRight: { flex: 1, gap: 4 },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priorityBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
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
    alignItems: 'flex-start',
  },
  resultLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.label,
  },
  resultText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
  },
});
