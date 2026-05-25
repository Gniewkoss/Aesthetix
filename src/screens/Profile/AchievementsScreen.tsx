import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../theme';
import { getAchievements } from './profileAchievements';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

export function AchievementsScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const history = useAnalysisStore((s) => s.history);
  const hasSharedProgress = useSettingsStore((s) => s.settings.hasSharedProgress);

  const achievements = useMemo(
    () =>
      getAchievements({
        xp: user?.xp ?? 0,
        level: user?.level ?? 1,
        streak: user?.streak ?? 0,
        scanCount: history.length,
        hasSharedProgress: !!hasSharedProgress,
      }),
    [user, history.length, hasSharedProgress],
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Achievements" subtitle={`${unlockedCount} of ${achievements.length} unlocked`} onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard>
              {achievements.map((item, i) => (
                <View
                  key={item.id}
                  style={[styles.row, i < achievements.length - 1 && styles.rowBorder]}
                >
                  <View style={[styles.iconWrap, item.unlocked && styles.iconWrapUnlocked]}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={item.unlocked ? COLORS.accent : COLORS.text.disabled}
                    />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.title, !item.unlocked && styles.titleLocked]}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                    {item.progress && <Text style={styles.progress}>{item.progress}</Text>}
                  </View>
                  {item.unlocked ? (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
                  ) : (
                    <Ionicons name="lock-closed-outline" size={16} color={COLORS.text.disabled} />
                  )}
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING['3xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnlocked: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  rowContent: { flex: 1 },
  title: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  titleLocked: { color: COLORS.text.secondary },
  description: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  progress: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
    marginTop: 4,
  },
});
