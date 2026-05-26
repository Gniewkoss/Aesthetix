import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MuscleGroups, MuscleGroupKey } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING } from '../../theme';
import { MUSCLE_GROUP_KEYS, MUSCLE_GROUP_META } from '../../constants';
import { MuscleBodyMap, getMuscleHeatColor } from './MuscleBodyMap';
import { MuscleTooltip } from './MuscleTooltip';

// Score-range legend
const LEGEND_ITEMS = [
  { color: '#22C55E', label: 'Strong',     range: '80+' },
  { color: '#84CC16', label: 'Good',       range: '65+' },
  { color: '#EAB308', label: 'Average',    range: '50+' },
  { color: '#F97316', label: 'Needs work', range: '35+' },
  { color: '#EF4444', label: 'Weak',       range: '<35' },
] as const;

function Legend() {
  return (
    <View style={styles.legendRow}>
      {LEGEND_ITEMS.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendLabel}>{item.label}</Text>
          <Text style={styles.legendRange}>{item.range}</Text>
        </View>
      ))}
    </View>
  );
}

interface ChipProps {
  muscleKey: MuscleGroupKey;
  analysis: MuscleGroups[MuscleGroupKey];
  selected: boolean;
  onPress: () => void;
}

function MuscleChip({ muscleKey, analysis, selected, onPress }: ChipProps) {
  const meta       = MUSCLE_GROUP_META[muscleKey];
  const color      = getMuscleHeatColor(analysis.score, analysis.visible);
  const notVisible = !analysis.visible;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        selected    && { borderColor: color, backgroundColor: color + '12' },
        notVisible  && styles.chipDisabled,
      ]}
    >
      {/* Score-color left bar */}
      <View style={[styles.chipBar, { backgroundColor: notVisible ? COLORS.border.hairline : color }]} />

      <View style={styles.chipContent}>
        <Text style={[styles.chipName, notVisible && { color: COLORS.text.disabled }]} numberOfLines={1}>
          {meta.label}
        </Text>
        <Text style={[styles.chipScore, { color: notVisible ? COLORS.text.disabled : color }]}>
          {notVisible ? '—' : analysis.score}
        </Text>
      </View>

      {selected && (
        <Ionicons name="chevron-down" size={10} color={color} style={styles.chipArrow} />
      )}
    </TouchableOpacity>
  );
}

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
        <Text style={styles.title}>Muscle Heat Map</Text>
        <Text style={styles.headerSub}>Tap a muscle to inspect</Text>
      </View>

      {/* Body SVG */}
      <View style={styles.bodyCenter}>
        <MuscleBodyMap
          muscleGroups={muscleGroups}
          onMusclePress={handleMusclePress}
          selectedMuscle={selected}
        />
      </View>

      {/* Muscle chips — primary tappable list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
        style={styles.chipsContainer}
      >
        {MUSCLE_GROUP_KEYS.map((key) => (
          <MuscleChip
            key={key}
            muscleKey={key}
            analysis={muscleGroups[key]}
            selected={selected === key}
            onPress={() => handleMusclePress(key)}
          />
        ))}
      </ScrollView>

      {/* Tooltip for selected muscle */}
      {selected && (
        <View style={styles.tooltipWrap}>
          <MuscleTooltip
            muscleKey={selected}
            analysis={muscleGroups[selected]}
            onClose={() => setSelected(null)}
          />
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendWrap}>
        <Legend />
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    paddingTop: LAYOUT.cardPad,
    paddingBottom: SPACING.base,
    marginBottom: LAYOUT.cardGap,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: 0.2,
  },
  headerSub: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
  },

  // SVG map
  bodyCenter: {
    alignItems: 'center',
    marginBottom: SPACING.base,
  },

  // Chips
  chipsContainer: { marginBottom: SPACING.sm },
  chipsScroll: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    overflow: 'hidden',
    minWidth: 78,
    height: 52,
  },
  chipDisabled: { opacity: 0.45 },
  chipBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  chipContent: {
    flex: 1,
    paddingHorizontal: 9,
    gap: 2,
  },
  chipName: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  chipScore: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONT_FAMILY.display,
    lineHeight: FONTS.sizes.md,
    letterSpacing: TRACKING.display,
  },
  chipArrow: { marginRight: 6 },

  // Tooltip
  tooltipWrap: {
    marginTop: 4,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },

  // Legend
  legendWrap: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.hairline,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
  },
  legendRange: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
});
