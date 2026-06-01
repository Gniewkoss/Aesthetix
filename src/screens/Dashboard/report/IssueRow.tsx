import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IssueDetected } from '../../../types';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  proportion: 'resize-outline',
  symmetry: 'git-compare-outline',
  posture: 'body-outline',
  composition: 'analytics-outline',
  balance: 'scale-outline',
};

const SEVERITY: Record<IssueDetected['severity'], { color: string; label: string }> = {
  high: { color: C.danger, label: 'High' },
  medium: { color: C.warning, label: 'Medium' },
  low: { color: C.info, label: 'Low' },
};

export const IssueRow = React.memo(function IssueRow({ issue }: { issue: IssueDetected }) {
  const icon = CATEGORY_ICONS[issue.category] ?? 'warning-outline';
  const sev = SEVERITY[issue.severity] ?? SEVERITY.medium;

  return (
    <View style={[styles.card, { borderColor: sev.color + '24' }]}>
      <View style={[styles.accent, { backgroundColor: sev.color }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: sev.color + '1A', borderColor: sev.color + '38' }]}>
            <Ionicons name={icon} size={13} color={sev.color} />
          </View>
          <Text style={[T.body, { color: C.text, flex: 1, fontSize: 15 }]} numberOfLines={2}>{issue.title}</Text>
          <View style={[styles.sevPill, { backgroundColor: sev.color + '1A', borderColor: sev.color + '38' }]}>
            <Text style={[T.overline, { color: sev.color }]}>{sev.label.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[T.bodySm, { color: C.text2, marginTop: S.sm, lineHeight: 21 }]}>{issue.description}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface1,
    borderRadius: R.lg,
    borderWidth: 1,
    marginBottom: LAYOUT.cardGap,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accent: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, padding: LAYOUT.cardPad },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  iconWrap: {
    width: 26, height: 26, borderRadius: R.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  sevPill: { paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.pill, borderWidth: 1, flexShrink: 0 },
});
