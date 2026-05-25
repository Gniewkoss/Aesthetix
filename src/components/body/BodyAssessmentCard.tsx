import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MuscleGroups, MuscleGroupKey } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { MuscleBodyMap } from './MuscleBodyMap';
import { MuscleLegend } from './MuscleLegend';
import { MuscleTooltip } from './MuscleTooltip';

interface BodyAssessmentCardProps {
  muscleGroups: MuscleGroups;
  entering?: any;
}

export function BodyAssessmentCard({ muscleGroups, entering }: BodyAssessmentCardProps) {
  const [selected, setSelected] = useState<MuscleGroupKey | null>(null);

  function handleMusclePress(key: MuscleGroupKey) {
    setSelected((prev) => (prev === key ? null : key));
  }

  return (
    <Animated.View entering={entering} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="body-outline" size={14} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Muscle Heat Map</Text>
      </View>

      <Text style={styles.subtitle}>
        Tap any muscle group to see your score and coaching notes.
      </Text>

      {/* Body map + legend side-by-side on wider screens, stacked on narrow */}
      <View style={styles.mapRow}>
        <MuscleBodyMap
          muscleGroups={muscleGroups}
          onMusclePress={handleMusclePress}
          selectedMuscle={selected}
        />

        {/* Legend */}
        <View style={styles.legendWrap}>
          <MuscleLegend />
        </View>
      </View>

      {/* Tooltip */}
      {selected && (
        <View style={styles.tooltipWrap}>
          <MuscleTooltip
            muscleKey={selected}
            analysis={muscleGroups[selected]}
            onClose={() => setSelected(null)}
          />
        </View>
      )}
    </Animated.View>
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
    gap: SPACING.sm,
    marginBottom: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginBottom: SPACING.base,
    lineHeight: FONTS.sizes.xs * 1.6,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.base,
  },
  legendWrap: {
    flex: 1,
    paddingTop: SPACING['2xl'],
  },
  tooltipWrap: {
    marginTop: SPACING.base,
  },
});
