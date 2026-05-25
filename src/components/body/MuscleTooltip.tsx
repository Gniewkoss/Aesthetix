import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { MuscleGroupAnalysis, MuscleGroupKey } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { getMuscleHeatColor } from './MuscleBodyMap';
import { MUSCLE_GROUP_META } from '../../constants';

function getMuscleComment(score: number, visible: boolean): string {
  if (!visible) return 'Not visible in the analyzed images — scan another angle.';
  if (score >= 80) return 'Well developed. One of your strongest muscle groups.';
  if (score >= 65) return 'Good development. Minor improvements possible.';
  if (score >= 50) return 'Average development. Consistent training will improve this.';
  if (score >= 35) return 'Below average. Prioritize this muscle group in your plan.';
  return 'Underdeveloped relative to the rest. Needs focused work.';
}

function getMuscleLabel(score: number, visible: boolean): string {
  if (!visible) return 'Not assessed';
  if (score >= 80) return 'STRONG';
  if (score >= 65) return 'GOOD';
  if (score >= 50) return 'AVERAGE';
  if (score >= 35) return 'NEEDS WORK';
  return 'WEAK';
}

interface MuscleTooltipProps {
  muscleKey: MuscleGroupKey;
  analysis: MuscleGroupAnalysis;
  onClose: () => void;
}

export function MuscleTooltip({ muscleKey, analysis, onClose }: MuscleTooltipProps) {
  const meta = MUSCLE_GROUP_META[muscleKey];
  const color = getMuscleHeatColor(analysis.score, analysis.visible);
  const comment = getMuscleComment(analysis.score, analysis.visible);
  const label = getMuscleLabel(analysis.score, analysis.visible);

  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(160)} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { borderColor: color + '40' }]}>
          <Ionicons name={meta.icon as any} size={16} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.name}>{meta.label}</Text>
          <Text style={styles.bodyPart}>{meta.bodyPart}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
          <Text style={[styles.scoreNum, { color }]}>{analysis.visible ? analysis.score : '—'}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={COLORS.text.muted} />
        </TouchableOpacity>
      </View>

      {/* Status badge + comment */}
      <View style={styles.body}>
        <View style={[styles.statusBadge, { backgroundColor: color + '14', borderColor: color + '30' }]}>
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
        <Text style={styles.comment}>{comment}</Text>
      </View>

      {/* Strengths & weaknesses */}
      {analysis.visible && (
        <View style={styles.details}>
          {analysis.strengths.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.green} style={{ marginTop: 1 }} />
              <Text style={styles.detailText}>{analysis.strengths[0]}</Text>
            </View>
          )}
          {analysis.weaknesses.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="alert-circle-outline" size={12} color={COLORS.amber} style={{ marginTop: 1 }} />
              <Text style={styles.detailText}>{analysis.weaknesses[0]}</Text>
            </View>
          )}
          {analysis.recommendations.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="barbell-outline" size={12} color={COLORS.accent} style={{ marginTop: 1 }} />
              <Text style={styles.detailText}>{analysis.recommendations[0]}</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  bodyPart: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginTop: 1,
  },
  scoreBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  scoreNum: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.display,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 1.2,
  },
  comment: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.6,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: SPACING.sm,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailText: {
    flex: 1,
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.xs * 1.6,
  },
});
