import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImprovementPlanItem } from '../../../types';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';

function priorityColor(priority: number): string {
  if (priority <= 2) return C.danger;
  if (priority <= 4) return C.warning;
  return C.volt;
}

/** A single improvement-plan step: priority-coded accent bar + action + result. */
export const PlanActionCard = React.memo(function PlanActionCard({ item }: { item: ImprovementPlanItem }) {
  const col = priorityColor(item.priority);

  return (
    <View style={[styles.card, { borderColor: col + '24' }]}>
      <View style={[styles.accent, { backgroundColor: col }]} />

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.priorityBadge, { backgroundColor: col + '1A', borderColor: col + '40' }]}>
            <Text style={[T.metricSm, { color: col, fontSize: 15 }]}>{item.priority}</Text>
          </View>
          <Text style={[T.cardTitle, { color: C.text, flex: 1 }]} numberOfLines={1}>{item.area}</Text>
          <View style={styles.timeframe}>
            <Ionicons name="time-outline" size={11} color={C.text3} />
            <Text style={[T.caption, { color: C.text3 }]}>{item.timeframe}</Text>
          </View>
        </View>

        <Text style={[T.body, { color: C.text2, marginTop: S.md }]}>{item.action}</Text>

        <View style={styles.resultRow}>
          <Text style={[T.label, { color: col }]}>Expected  </Text>
          <Text style={[T.bodySm, { color: C.text2, flex: 1 }]}>{item.expectedResult}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface1,
    borderRadius: R.lg,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: LAYOUT.cardGap,
  },
  accent: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, padding: LAYOUT.cardPad },
  header: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timeframe: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: S.md,
    paddingTop: S.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
});
