import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';
import { RANK_CONFIG, XP_REWARDS } from '../../constants';
import { useSettingsStore } from '../../store/useSettingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MenuIconName = keyof typeof Ionicons.glyphMap;
type ProfileMenuRoute = 'Achievements' | 'Notifications' | 'ManageSubscription' | 'PrivacyData' | 'HelpSupport';

const XP_PER_LEVEL = 500;

// Icon color per menu item — subtle personality per action
const MENU_ICON_COLORS: Record<string, string> = {
  'Achievements':         '#F59E0B',
  'Share Progress':       COLORS.accent,
  'Notifications':        '#8B5CF6',
  'Manage Subscription':  COLORS.green,
  'Privacy & Data':       COLORS.text.muted,
  'Help & Support':       COLORS.text.muted,
};

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, logout, deleteAccount, isLoading, addXP } = useAuthStore();
  const history = useAnalysisStore((s) => s.history);
  const settings            = useSettingsStore((s) => s.settings);
  const hydrateSettings     = useSettingsStore((s) => s.hydrate);
  const markShareBonusClaimed = useSettingsStore((s) => s.markShareBonusClaimed);
  const markSharedProgress  = useSettingsStore((s) => s.markSharedProgress);

  useEffect(() => {
    if (user?.id) void hydrateSettings(user.id);
  }, [user?.id, hydrateSettings]);

  const scanCount  = history.length;
  const scoreGain  = history.length >= 2
    ? history[0].overallScore - history[history.length - 1].overallScore
    : 0;
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;
  const xpInLevel  = user ? user.xp % XP_PER_LEVEL : 0;
  const xpProgress = xpInLevel / XP_PER_LEVEL;

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
              Alert.alert(
                'Could not delete account',
                err instanceof Error ? err.message : 'Please try again later.',
              );
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
        `My Aesthetix AI physique score: ${latest.overallScore}/100\n` +
        `Body fat: ${latest.bodyFatRange ?? `${latest.bodyFat}%`}  |  V-Taper: ${latest.vTaperScore}  |  Symmetry: ${latest.symmetryScore}\n\n` +
        `Rank: ${user?.rank ?? 'Beginner'}  |  Streak: ${user?.streak ?? 0} days`,
    });

    if (result.action === Share.sharedAction) {
      markSharedProgress();
      const today = new Date().toISOString().split('T')[0];
      if (settings.lastShareBonusDate !== today) {
        addXP(XP_REWARDS.shareBonus);
        markShareBonusClaimed();
        Alert.alert('Progress shared', `+${XP_REWARDS.shareBonus} XP earned for sharing today.`);
      }
    }
  };

  const MENU_ITEMS: {
    icon: MenuIconName;
    label: string;
    route?: ProfileMenuRoute;
    onPress?: () => void;
  }[] = [
    { icon: 'trophy-outline',         label: 'Achievements',        route: 'Achievements'        },
    { icon: 'share-social-outline',   label: 'Share Progress',      onPress: handleShareProgress },
    { icon: 'notifications-outline',  label: 'Notifications',       route: 'Notifications'       },
    { icon: 'card-outline',           label: 'Manage Subscription', route: 'ManageSubscription'  },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Data',    route: 'PrivacyData'         },
    { icon: 'help-circle-outline',    label: 'Help & Support',      route: 'HelpSupport'         },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Profile header ────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.profileHeader}>
            {/* Avatar with gradient glow ring */}
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={rankConfig?.gradient ?? ['#374151', '#6B7280']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.[0]?.toUpperCase() ?? 'A'}
                </Text>
              </LinearGradient>
            </View>

            <Text style={styles.userName}>{user?.name ?? 'Athlete'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            <View style={styles.rankRow}>
              <Ionicons
                name={(rankConfig?.icon ?? 'leaf-outline') as any}
                size={13}
                color={rankConfig?.color ?? COLORS.text.muted}
              />
              <Text style={[styles.rankLabel, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                {user?.rank ?? 'Beginner'}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.rankLevel}>Lv. {user?.level ?? 1}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── XP Progress ───────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <GlassCard style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>XP Progress</Text>
                <Text style={styles.xpValue}>{user?.xp ?? 0} XP</Text>
              </View>
              <View style={styles.xpTrack}>
                <LinearGradient
                  colors={['#1D4ED8', '#3B82F6']}
                  style={[styles.xpFill, { width: `${xpProgress * 100}%` as any }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.xpNext}>
                {xpInLevel}/{XP_PER_LEVEL} XP to Level {(user?.level ?? 1) + 1}
              </Text>
            </GlassCard>
          </Animated.View>

          {/* ── Stats row ────────────────────────────────  */}
          <Animated.View entering={FadeInDown.delay(130).duration(350)} style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={18} color={COLORS.amber} />
              <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="scan-outline" size={18} color={COLORS.accent} />
              <Text style={styles.statValue}>{scanCount}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={18} color={COLORS.green} />
              <Text style={styles.statValue}>{scoreGain >= 0 ? '+' : ''}{scoreGain}</Text>
              <Text style={styles.statLabel}>Score gain</Text>
            </View>
          </Animated.View>

          {/* ── Premium upsell ────────────────────────── */}
          {!user?.isPremium && (
            <Animated.View entering={FadeInDown.delay(180).duration(350)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Premium')}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={['#5B21B6', '#7C3AED']}
                  style={styles.premiumBanner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.premiumBannerLeft}>
                    <Ionicons name="flash" size={16} color="#fff" style={{ opacity: 0.9 }} />
                    <View>
                      <Text style={styles.premiumBannerText}>Upgrade to Premium</Text>
                      <Text style={styles.premiumBannerSub}>Unlimited scans · AI coach · Full reports</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Menu ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(230).duration(350)}>
            <GlassCard style={{ marginBottom: SPACING.base }}>
              {MENU_ITEMS.map((item, i) => {
                const iconColor = MENU_ICON_COLORS[item.label] ?? COLORS.text.secondary;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      if (item.route) navigation.navigate(item.route);
                      else item.onPress?.();
                    }}
                    style={[
                      styles.menuItem,
                      i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.menuIconWrap, { borderColor: iconColor + '22', backgroundColor: iconColor + '0E' }]}>
                      <Ionicons name={item.icon} size={15} color={iconColor} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={13} color={COLORS.text.disabled} />
                  </TouchableOpacity>
                );
              })}
            </GlassCard>
          </Animated.View>

          {/* ── Account actions ───────────────────────── */}
          <Animated.View entering={FadeInDown.delay(280).duration(350)} style={styles.accountActions}>
            <GradientButton
              title="Sign Out"
              onPress={logout}
              variant="outline"
              size="md"
              disabled={isLoading}
            />
            <GradientButton
              title="Delete Account"
              onPress={handleDeleteAccount}
              variant="danger"
              size="md"
              loading={isLoading}
              disabled={isLoading}
              style={{ marginTop: SPACING.md }}
            />
            <Text style={styles.deleteHint}>
              Deleting your account removes all scans and data from our servers permanently.
            </Text>
          </Animated.View>

          <Text style={styles.version}>Aesthetix AI v1.0.0</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  // ── Profile header
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: SPACING.base,
    // Soft glow ring
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    flex: 1,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: '#fff',
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  userEmail: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 3,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  rankLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  rankLevel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
  },

  // ── XP card
  xpCard: { marginBottom: 10 },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  xpLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
  },
  xpValue: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  xpTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  xpFill: { height: '100%', borderRadius: RADIUS.full },
  xpNext: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

  // ── Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: SPACING.base,
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    textAlign: 'center',
  },

  // ── Premium banner
  premiumBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  premiumBannerText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#fff',
  },
  premiumBannerSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(255,255,255,0.62)',
    marginTop: 2,
  },

  // ── Menu
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyMedium,
  },

  // ── Account actions
  accountActions: { marginBottom: SPACING.sm },
  deleteHint: {
    textAlign: 'center',
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginTop: SPACING.sm,
    lineHeight: FONTS.sizes.xs * 1.5,
    paddingHorizontal: SPACING.md,
  },
  version: {
    textAlign: 'center',
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginTop: SPACING.xl,
    marginBottom: SPACING.base,
    letterSpacing: TRACKING.label,
  },
});
