import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MuscleGroupAnalysis, MuscleGroupKey } from '../../../types';
import { MUSCLE_GROUP_META } from '../../../constants';
import { C, T, R, S, LAYOUT, SCORE_CIRCLE_TEXT } from '../../../theme/obsidian';
import { scoreColor } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';

interface MuscleRowProps {
  muscleKey: MuscleGroupKey;
  analysis: MuscleGroupAnalysis;
  onPress?: () => void;
}

export const MuscleRow = React.memo(function MuscleRow({ muscleKey, analysis, onPress }: MuscleRowProps) {
  const meta = MUSCLE_GROUP_META[muscleKey];

  if (!analysis.visible) return null;

  const col = scoreColor(analysis.score);

  return (
    <PressableScale scaleTo={0.985} onPress={onPress} accessibilityLabel={`${meta.label}, score ${analysis.score}. View analysis.`} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <View style={[styles.iconTile, { backgroundColor: col + '1A', borderColor: col + '38' }]}>
            <Ionicons name={meta.icon as any} size={16} color={col} />
          </View>
          <View>
            <Text style={[T.body, { color: C.text, fontSize: 15 }]}>{meta.label}</Text>
            <Text style={[T.caption, { color: C.text3 }]}>{meta.bodyPart}</Text>
          </View>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: col + '14', borderColor: col + '38' }]}>
          <Text style={[SCORE_CIRCLE_TEXT, { color: col }]}>{analysis.score}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${analysis.score}%`, backgroundColor: col }]} />
      </View>

      {analysis.weaknesses.length > 0 && (
        <View style={styles.weakRow}>
          <Ionicons name="alert-circle-outline" size={12} color={C.text3} />
          <Text style={[T.caption, { color: C.text3, flex: 1 }]} numberOfLines={1}>{analysis.weaknesses[0]}</Text>
        </View>
      )}

      <View style={styles.tapRow}>
        <Text style={[T.caption, { color: C.text3 }]}>View analysis</Text>
        <Ionicons name="chevron-forward" size={13} color={C.text3} />
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface1,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  iconTile: { width: 34, height: 34, borderRadius: R.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scoreBadge: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  track: { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: R.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: R.pill },
  weakRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: S.sm },
  tapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: S.sm },
});
