import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import { PressableScale } from './PressableScale';

interface NudgeCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
}

/** Contextual coaching nudge — e.g. "Keep your streak". */
export function NudgeCard({ icon, accent, title, subtitle, ctaLabel, onPress }: NudgeCardProps) {
  return (
    <PressableScale
      scaleTo={0.985}
      onPress={onPress}
      accessibilityLabel={`${title}. ${ctaLabel}.`}
      style={[styles.card, { borderColor: accent + '33', backgroundColor: accent + '12' }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + '1F', borderColor: accent + '40' }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <View style={styles.body}>
        <Text style={[T.label, { color: C.text }]}>{title}</Text>
        <Text style={[T.caption, { color: C.text2, marginTop: 2 }]}>{subtitle}</Text>
      </View>
      <View style={styles.cta}>
        <Text style={[T.label, { color: accent }]}>{ctaLabel}</Text>
        <Ionicons name="chevron-forward" size={14} color={accent} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: R.lg,
    borderWidth: 1,
    padding: LAYOUT.tilePad,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
});
