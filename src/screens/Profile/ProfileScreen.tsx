import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { isSupabaseConfigured } from '../../api/supabase';
import { claimShareBonus } from '../../api/gamification';
import { captureException } from '../../lib/errorTracking';
import { RANK_CONFIG, XP_REWARDS } from '../../constants';
import { C, T, R, S, LAYOUT, E } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { IdentityHero } from './profile/IdentityHero';
import { StatTriad } from './profile/StatTriad';
import { XpCard } from './profile/XpCard';
import { PremiumBanner } from './profile/PremiumBanner';
import { SettingsRow } from './profile/SettingsRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MenuIconName = keyof typeof Ionicons.glyphMap;
type ProfileMenuRoute =
  | 'Achievements' | 'Appearance' | 'Notifications'
  | 'ManageSubscription' | 'PrivacyData' | 'HelpSupport';

const XP_PER_LEVEL = 500;
const TAB_CLEARANCE = 112;

const MENU_ICON_COLORS: Record<string, string> = {
  'Achievements': C.warning,
  'Appearance': '#8B7BFF',
  'Share Progress': C.volt,
  'Notifications': C.info,
  'Manage Subscription': C.success,
  'Privacy & Data': C.info,
  'Help & Support': '#8B7BFF',
};

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const reduceMotion = useReducedMotion();
  const { user, logout, deleteAccount, addXP, syncFromSession } = useAuthStore();
  const history = useAnalysisStore((s) => s.history);
  const settings = useSettingsStore((s) => s.settings);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const markShareBonusClaimed = useSettingsStore((s) => s.markShareBonusClaimed);
  const markSharedProgress = useSettingsStore((s) => s.markSharedProgress);

  useEffect(() => {
    if (user?.id) void hydrateSettings(user.id);
  }, [user?.id, hydrateSettings]);

  const scanCount = history.length;
  const scoreGain = history.length >= 2
    ? history[0].overallScore - history[history.length - 1].overallScore
    : 0;
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;
  const xpInLevel = user ? user.xp % XP_PER_LEVEL : 0;

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account, all scans, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            deleteAccount().catch((err: unknown) => {
              Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Please try again later.');
            });
          },
        },
      ],
    );
  };

  const handleShareProgress = async () => {
    if (history.length === 0) {
      Alert.alert('No scans yet', 'Run your first scan to share your progress.');
      return;
    }
    const latest = history[0];
    const result = await Share.share({
      message:
        `My Aesthetix physique score: ${latest.overallScore}/100\n` +
        `Body fat: ${latest.bodyFatRange ?? `${latest.bodyFat}%`}  |  V-Taper: ${latest.vTaperScore}  |  Symmetry: ${latest.symmetryScore}\n\n` +
        `Rank: ${user?.rank ?? 'Beginner'}  |  Streak: ${user?.streak ?? 0} days`,
    });

    if (result.action === Share.sharedAction) {
      markSharedProgress();
      const today = new Date().toISOString().split('T')[0];
      if (settings.lastShareBonusDate === today) return;

      if (isSupabaseConfigured) {
        try {
          const bonus = await claimShareBonus();
          if (bonus.awarded) {
            markShareBonusClaimed();
            await syncFromSession();
            Alert.alert('Progress shared', `+${bonus.xp_awarded ?? XP_REWARDS.shareBonus} XP earned for sharing today.`);
          }
        } catch (err) {
          captureException(err, { op: 'claimShareBonus' });
        }
        return;
      }

      addXP(XP_REWARDS.shareBonus);
      markShareBonusClaimed();
      Alert.alert('Progress shared', `+${XP_REWARDS.shareBonus} XP earned for sharing today.`);
    }
  };

  const MENU_ITEMS: {
    icon: MenuIconName; label: string; route?: ProfileMenuRoute; onPress?: () => void; badge?: string;
  }[] = [
    { icon: 'trophy-outline', label: 'Achievements', route: 'Achievements' },
    { icon: 'color-palette-outline', label: 'Appearance', route: 'Appearance' },
    { icon: 'share-social-outline', label: 'Share Progress', onPress: handleShareProgress },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'card-outline', label: 'Manage Subscription', route: 'ManageSubscription', badge: user?.isPremium ? 'PRO' : undefined },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Data', route: 'PrivacyData' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: 'HelpSupport' },
  ];

  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[T.h1, { color: C.text }]}>Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Identity */}
          <Animated.View entering={enter(0)} style={styles.identity}>
            <IdentityHero
              name={user?.name ?? 'Athlete'}
              email={user?.email}
              rank={user?.rank ?? 'Beginner'}
              level={user?.level ?? 1}
              rankColor={rankConfig?.color ?? C.text2}
              rankIcon={rankConfig?.icon ?? 'leaf-outline'}
              rankGradient={(rankConfig?.gradient as readonly [string, string]) ?? ['#374151', '#6B7280']}
            />
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={enter(1)} style={styles.section}>
            <StatTriad streak={user?.streak ?? 0} scans={scanCount} scoreGain={scoreGain} reduceMotion={reduceMotion} />
          </Animated.View>

          {/* XP */}
          <Animated.View entering={enter(2)} style={styles.section}>
            <Text style={[T.overline, styles.groupLabel]}>EXPERIENCE</Text>
            <XpCard xp={user?.xp ?? 0} xpInLevel={xpInLevel} xpPerLevel={XP_PER_LEVEL} level={user?.level ?? 1} reduceMotion={reduceMotion} />
          </Animated.View>

          {/* Premium */}
          {!user?.isPremium && (
            <Animated.View entering={enter(3)} style={styles.section}>
              <PremiumBanner onPress={() => navigation.navigate('Premium')} />
            </Animated.View>
          )}

          {/* Settings */}
          <Animated.View entering={enter(4)} style={styles.section}>
            <Text style={[T.overline, styles.groupLabel]}>SETTINGS</Text>
            <View style={styles.group}>
              {MENU_ITEMS.map((item, i) => (
                <SettingsRow
                  key={item.label}
                  icon={item.icon}
                  iconColor={MENU_ICON_COLORS[item.label]}
                  title={item.label}
                  badge={item.badge}
                  showBorder={i < MENU_ITEMS.length - 1}
                  onPress={() => { if (item.route) navigation.navigate(item.route); else item.onPress?.(); }}
                />
              ))}
            </View>
          </Animated.View>

          {/* Account */}
          <Animated.View entering={enter(5)} style={styles.section}>
            <Text style={[T.overline, styles.groupLabel]}>ACCOUNT</Text>
            <View style={styles.group}>
              <SettingsRow icon="log-out-outline" title="Sign out" iconColor={C.text3} neutralIcon showChevron={false} onPress={logout} showBorder />
              <SettingsRow icon="trash-outline" title="Delete account" danger onPress={handleDeleteAccount} />
            </View>
            <Text style={[T.caption, styles.hint]}>
              Deleting your account removes all scans and data from our servers permanently.
            </Text>
          </Animated.View>

          <Text style={[T.caption, styles.version]}>Aesthetix v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  header: { paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, paddingBottom: S.base, gap: 2 },

  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: TAB_CLEARANCE },

  identity: { marginBottom: LAYOUT.sectionGap },
  section: { marginBottom: LAYOUT.sectionGap },
  groupLabel: { color: C.text3, marginBottom: S.md },

  group: {
    ...E.card,
    borderRadius: R.xl,
    overflow: 'hidden',
  },

  hint: {
    color: C.text3,
    textAlign: 'center',
    marginTop: S.md,
    paddingHorizontal: S.md,
    lineHeight: 17,
  },
  version: { color: C.text3, textAlign: 'center', marginTop: S.sm },
});
