import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { InfoRow } from '../../components/common/InfoRow';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING } from '../../theme';
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
        <PageHeader variant="push" title="Achievements" subtitle={`${unlockedCount} of ${achievements.length} unlocked`} onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard>
              {achievements.map((item, i) => (
                <InfoRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.description}
                  extraText={item.progress}
                  showBorder={i < achievements.length - 1}
                  titleStyle={!item.unlocked ? { color: COLORS.text.secondary } : undefined}
                  leftContent={
                    <View style={[styles.iconWrap, item.unlocked && styles.iconWrapUnlocked]}>
                      <Ionicons
                        name={item.icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={item.unlocked ? COLORS.accent : COLORS.text.disabled}
                      />
                    </View>
                  }
                  rightContent={
                    item.unlocked
                      ? <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
                      : <Ionicons name="lock-closed-outline" size={16} color={COLORS.text.disabled} />
                  }
                />
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
  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING['3xl'] },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glass.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnlocked: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
});
