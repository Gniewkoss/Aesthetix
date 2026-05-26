import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';
import { MuscleGroupAnalysis, MuscleGroupKey } from '../../types';
import { MUSCLE_GROUP_META } from '../../constants';
import { ScoreBar } from '../ui/ScoreBar';

interface MuscleGroupCardProps {
  muscleKey: MuscleGroupKey;
  analysis: MuscleGroupAnalysis;
  onPress?: () => void;
  index?: number;
}

export function MuscleGroupCard({ muscleKey, analysis, onPress, index = 0 }: MuscleGroupCardProps) {
  const meta = MUSCLE_GROUP_META[muscleKey];
  const isVisible = analysis.visible;
  const color = isVisible ? getScoreColor(analysis.score) : COLORS.text.disabled;

  if (!isVisible) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.cardHidden]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.iconWrap, styles.iconWrapHidden]}>
                <Ionicons name={meta.icon as any} size={16} color={COLORS.text.disabled} />
              </View>
              <View style={{ marginLeft: SPACING.sm }}>
                <Text style={[styles.name, styles.nameHidden]}>{meta.label}</Text>
                <Text style={styles.bodyPart}>{meta.bodyPart}</Text>
              </View>
            </View>
            <View style={styles.notVisibleBadge}>
              <Ionicons name="eye-off-outline" size={11} color={COLORS.text.muted} />
              <Text style={styles.notVisibleText}>Not Visible</Text>
            </View>
          </View>
          <Text style={styles.notVisibleHint}>Not in frame — scan another angle to analyze</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { borderColor: color + '30' }]}>
              <Ionicons name={meta.icon as any} size={16} color={color} />
            </View>
            <View style={{ marginLeft: SPACING.sm }}>
              <Text style={styles.name}>{meta.label}</Text>
              <Text style={styles.bodyPart}>{meta.bodyPart}</Text>
            </View>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: color + '14', borderColor: color + '35' }]}>
            <Text style={[styles.scoreText, { color }]}>{analysis.score}</Text>
          </View>
        </View>

        <ScoreBar label="" score={analysis.score} showScore={false} height={3} delay={index * 60} />

        {analysis.weaknesses.length > 0 && (
          <View style={styles.weaknessRow}>
            <Ionicons name="alert-circle-outline" size={12} color={COLORS.text.disabled} style={{ marginTop: 1 }} />
            <Text style={styles.weaknessText} numberOfLines={1}>
              {analysis.weaknesses[0]}
            </Text>
          </View>
        )}

        <View style={styles.tapHintRow}>
          <Text style={styles.tapHint}>View analysis</Text>
          <Ionicons name="chevron-forward" size={12} color={COLORS.text.disabled} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
  },
  cardHidden: {
    opacity: 0.65,
    borderColor: COLORS.border.hairline,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapHidden: {
    borderColor: COLORS.border.hairline,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  nameHidden: {
    color: COLORS.text.muted,
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
  },
  scoreText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.display,
  },
  notVisibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
  },
  notVisibleText: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  notVisibleHint: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginTop: -SPACING.sm,
  },
  weaknessRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: SPACING.sm,
  },
  weaknessText: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    gap: 2,
  },
  tapHint: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
});
