import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SPACING, getScoreColor, getScoreGradient } from '../../theme';
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
  const color = getScoreColor(analysis.score);
  const gradient = getScoreGradient(analysis.score);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
        style={[styles.card, { borderColor: color + '25' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>{meta.emoji}</Text>
            <View style={{ marginLeft: SPACING.sm }}>
              <Text style={styles.name}>{meta.label}</Text>
              <Text style={styles.bodyPart}>{meta.bodyPart}</Text>
            </View>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
            <Text style={[styles.scoreText, { color }]}>{analysis.score}</Text>
          </View>
        </View>

        {/* Score bar */}
        <ScoreBar label="" score={analysis.score} showScore={false} height={4} delay={index * 80} />

        {/* Weaknesses preview */}
        {analysis.weaknesses.length > 0 && (
          <View style={styles.weaknessRow}>
            <Text style={styles.weaknessIcon}>⚠️</Text>
            <Text style={styles.weaknessText} numberOfLines={1}>
              {analysis.weaknesses[0]}
            </Text>
          </View>
        )}

        {/* Tap hint */}
        <Text style={styles.tapHint}>Tap for full analysis →</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.base,
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
  emoji: {
    fontSize: 22,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  bodyPart: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    marginTop: 1,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.black,
  },
  weaknessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  weaknessIcon: {
    fontSize: 11,
    marginRight: 5,
  },
  weaknessText: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    flex: 1,
  },
  tapHint: {
    color: COLORS.cyan + '80',
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.sm,
    textAlign: 'right',
  },
});
