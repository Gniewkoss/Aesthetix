import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { GroupCard } from '../../components/obsidian/GroupCard';
import { VoltRing } from '../Dashboard/home/VoltRing';
import { AnimatedCount } from '../Dashboard/home/AnimatedCount';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { getAchievements, type Achievement } from './profileAchievements';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

export function AchievementsScreen({ navigation }: Props) {
  const reduceMotion = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const history = useAnalysisStore((s) => s.history);
  const hasSharedProgress = useSettingsStore((s) => s.settings.hasSharedProgress);

  const achievements = useMemo(
    () => getAchievements({
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      streak: user?.streak ?? 0,
      scanCount: history.length,
      hasSharedProgress: !!hasSharedProgress,
    }),
    [user, history.length, hasSharedProgress],
  );

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Achievements" subtitle={`${unlocked} of ${total} unlocked`} onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <Animated.View entering={enter(0)} style={styles.summary}>
            <VoltRing score={pct} size={72} strokeWidth={6} instant={reduceMotion}>
              <AnimatedCount value={pct} instant={reduceMotion} style={[T.metricSm, { color: C.volt }]} />
            </VoltRing>
            <View style={{ flex: 1 }}>
              <Text style={[T.cardTitle, { color: C.text }]}>{unlocked} of {total} unlocked</Text>
              <Text style={[T.bodySm, { color: C.text2, marginTop: 2 }]}>Keep scanning to unlock more.</Text>
            </View>
          </Animated.View>

          {/* List */}
          <Animated.View entering={enter(1)}>
            <GroupCard>
              {achievements.map((item, i) => (
                <AchievementRow key={item.id} item={item} showBorder={i < total - 1} />
              ))}
            </GroupCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AchievementRow({ item, showBorder }: { item: Achievement; showBorder: boolean }) {
  const { unlocked } = item;
  return (
    <View style={[styles.row, showBorder && styles.border]}>
      <View style={[styles.iconTile, unlocked ? styles.iconTileOn : styles.iconTileOff]}>
        <Ionicons name={item.icon as any} size={18} color={unlocked ? C.volt : C.text3} />
      </View>
      <View style={styles.info}>
        <Text style={[T.body, { color: unlocked ? C.text : C.text2, fontSize: 15 }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[T.caption, { color: C.text3, marginTop: 1 }]} numberOfLines={2}>{item.description}</Text>
      </View>
      {unlocked ? (
        <Ionicons name="checkmark-circle" size={20} color={C.success} />
      ) : (
        <View style={styles.lockEnd}>
          {item.progress ? <Text style={[T.caption, { color: C.text3 }]}>{item.progress}</Text> : null}
          <Ionicons name="lock-closed" size={14} color={C.text3} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.base,
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.sectionGap,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: LAYOUT.cardPad },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconTileOn: { backgroundColor: C.voltDim, borderColor: C.voltBorder },
  iconTileOff: { backgroundColor: C.surface2, borderColor: C.border },
  info: { flex: 1, minWidth: 0 },
  lockEnd: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
});
