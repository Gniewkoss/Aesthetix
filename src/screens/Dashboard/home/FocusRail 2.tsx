import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import { MUSCLE_GROUP_META } from '../../../constants';
import { PhysiqueAnalysis } from '../../../types';
import { scoreColor } from '../../../theme/obsidian';
import { PressableScale } from './PressableScale';

interface FocusRailProps {
  analysis: PhysiqueAnalysis;
  onPressArea: () => void;
}

/** Horizontal rail of priority muscle chips, color-coded by tier score. */
export function FocusRail({ analysis, onPressArea }: FocusRailProps) {
  const areas = analysis.priorityAreas.slice(0, 5);
  if (areas.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {areas.map((area) => {
        const meta = MUSCLE_GROUP_META[area as keyof typeof MUSCLE_GROUP_META];
        const score = analysis.muscleGroups[area as keyof typeof analysis.muscleGroups]?.score ?? 0;
        const col = scoreColor(score);
        return (
          <PressableScale
            key={area}
            onPress={onPressArea}
            accessibilityLabel={`${meta?.label ?? area}, score ${score}`}
            style={[styles.chip, { borderColor: col + '2E' }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: col + '1A' }]}>
              <Ionicons name={(meta?.icon ?? 'barbell-outline') as any} size={15} color={col} />
            </View>
            <Text style={[T.label, { color: C.text }]} numberOfLines={1}>{meta?.label ?? area}</Text>
            <Text style={[T.metricSm, { color: col }]}>{score}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    gap: S.sm,
    paddingRight: LAYOUT.screenX,
  },
  chip: {
    width: 116,
    backgroundColor: C.surface1,
    borderRadius: R.lg,
    borderWidth: 1,
    padding: LAYOUT.tilePad,
    gap: S.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
