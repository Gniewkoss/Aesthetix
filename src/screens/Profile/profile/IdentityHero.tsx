import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S } from '../../../theme/obsidian';

interface IdentityHeroProps {
  name: string;
  email?: string | null;
  rank: string;
  level: number;
  rankColor: string;
  rankIcon: string;
  rankGradient: readonly [string, string];
}

/** Avatar with rank-gradient ring + name + rank/level pills. */
export function IdentityHero({ name, email, rank, level, rankColor, rankIcon, rankGradient }: IdentityHeroProps) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? 'A';

  return (
    <View style={styles.root}>
      <LinearGradient colors={rankGradient} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.ring}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
      </LinearGradient>

      <Text style={[T.title, styles.name]} numberOfLines={1}>{name}</Text>
      {email ? (
        <Text style={[T.bodySm, styles.email]} numberOfLines={1}>{email}</Text>
      ) : null}

      <View style={styles.pillRow}>
        <View style={[styles.rankPill, { borderColor: rankColor + '40' }]}>
          <Ionicons name={rankIcon as any} size={12} color={rankColor} />
          <Text style={[T.label, { color: rankColor }]}>{rank}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={[T.label, { color: C.text2 }]}>Lv. {level}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingTop: S.sm },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...T.heroNum, fontSize: 34, lineHeight: 38, color: C.text },
  name: { color: C.text, marginTop: S.base, textAlign: 'center' },
  email: { color: C.text2, marginTop: S.xs, textAlign: 'center', maxWidth: '100%' },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.md },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: S.md,
    paddingVertical: 5,
    borderRadius: R.pill,
    borderWidth: 1,
    backgroundColor: C.surface2,
  },
  levelBadge: {
    paddingHorizontal: S.md,
    paddingVertical: 5,
    borderRadius: R.pill,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
});
