import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { GlassCard } from '../../components/ui/GlassCard';
import { PageHeader } from '../../components/common/PageHeader';
import { SettingsSection } from '../../components/common/SettingsSection';
import { NavInfoRow } from '../../components/common/NavInfoRow';
import { TAB_SCROLL_CONTENT } from '../../components/common/tabScreenLayout';
import {
  COLORS, FONT_FAMILY, FONTS, GRADIENTS, LAYOUT, RADIUS, SPACING, TRACKING,
} from '../../theme';
import { RANK_CONFIG, XP_REWARDS } from '../../constants';
import { useSettingsStore } from '../../store/useSettingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MenuIconName = keyof typeof Ionicons.glyphMap;
type ProfileMenuRoute = 'Achievements' | 'Notifications' | 'ManageSubscription' | 'PrivacyData' | 'HelpSupport';

const XP_PER_LEVEL = 500;

const MENU_ICON_COLORS: Record<string, string> = {
  'Achievements': COLORS.amber,
  'Share Progress': COLORS.accent,
  'Notifications': COLORS.indigo,
  'Manage Subscription': COLORS.green,
  'Privacy & Data': COLORS.text.muted,
  'Help & Support': COLORS.text.muted,
};

function StatBlock({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: MenuIconName;
  iconColor: string;
  value: string | number;
  label: string;
}) {
  return (
    <View style={stat.root}>
      <View style={[stat.iconWrap, { backgroundColor: iconColor + '14', borderColor: iconColor + '28' }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={[stat.value, { color: iconColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={stat.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const stat = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.xs,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
});

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout, deleteAccount, isLoading, addXP } = useAuthStore();
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
    badge?: string;
  }[] = [
    { icon: 'trophy-outline', label: 'Achievements', route: 'Achievements' },
    { icon: 'share-social-outline', label: 'Share Progress', onPress: handleShareProgress },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'card-outline', label: 'Manage Subscription', route: 'ManageSubscription', badge: user?.isPremium ? 'PRO' : undefined },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Data', route: 'PrivacyData' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: 'HelpSupport' },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageHeader variant="tab" title="Profile" subtitle={user?.email} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.duration(350)} style={styles.identityBlock}>
            <Avatar
              fallback={user?.name?.[0] ?? 'A'}
              size="xl"
              ringColors={rankConfig?.gradient as readonly [string, string] | undefined ?? ['#374151', '#6B7280']}
            />
            <Text style={styles.userName}>{user?.name ?? 'Athlete'}</Text>
            <View style={styles.rankRow}>
              <View style={[styles.rankPill, { borderColor: (rankConfig?.color ?? COLORS.text.muted) + '30' }]}>
                <Ionicons
                  name={(rankConfig?.icon ?? 'leaf-outline') as any}
                  size={11}
                  color={rankConfig?.color ?? COLORS.text.muted}
                />
                <Text style={[styles.rankText, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                  {user?.rank ?? 'Beginner'}
                </Text>
              </View>
              <Badge variant="secondary" size="sm">Lv. {user?.level ?? 1}</Badge>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(350)}>
            <GlassCard padding={0}>
              <View style={styles.statsRow}>
                <StatBlock icon="flame" iconColor={COLORS.amber} value={user?.streak ?? 0} label="Day streak" />
                <View style={styles.statDivider} />
                <StatBlock icon="scan-outline" iconColor={COLORS.accent} value={scanCount} label="Scans" />
                <View style={styles.statDivider} />
                <StatBlock
                  icon="trending-up"
                  iconColor={scoreGain >= 0 ? COLORS.green : COLORS.red}
                  value={`${scoreGain >= 0 ? '+' : ''}${scoreGain}`}
                  label="Score gain"
                />
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.sectionGap}>
            <SettingsSection label="Experience" noTopMargin>
              <View style={styles.xpInner}>
                <View style={styles.xpHeader}>
                  <View style={styles.xpTitleRow}>
                    <Ionicons name="flash" size={13} color={COLORS.accent} />
                    <Text style={styles.xpTitle}>XP Progress</Text>
                  </View>
                  <Text style={styles.xpValue}>{user?.xp ?? 0} XP</Text>
                </View>
                <View style={styles.xpTrack}>
                  <LinearGradient
                    colors={['#1D4ED8', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.xpFill, { width: `${xpProgress * 100}%` as any }]}
                  />
                </View>
                <Text style={styles.xpSubline}>
                  {xpInLevel} / {XP_PER_LEVEL} XP to Level {(user?.level ?? 1) + 1}
                </Text>
              </View>
            </SettingsSection>
          </Animated.View>

          {!user?.isPremium && (
            <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.sectionGap}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Premium')}
                activeOpacity={0.82}
                style={styles.premiumBanner}
              >
                <LinearGradient
                  colors={GRADIENTS.premium}
                  start={{ x: 0.0, y: 0 }}
                  end={{ x: 1.0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.premiumLeft}>
                  <View style={styles.premiumIconWrap}>
                    <Ionicons name="flash" size={14} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                    <Text style={styles.premiumSub}>Unlimited scans · AI coach · Full reports</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.sectionGap}>
            <SettingsSection label="Settings" noTopMargin>
              {MENU_ITEMS.map((item, i) => {
                const iconColor = MENU_ICON_COLORS[item.label] ?? COLORS.text.secondary;
                return (
                  <NavInfoRow
                    key={item.label}
                    title={item.label}
                    icon={item.icon}
                    iconColor={iconColor}
                    badge={item.badge}
                    showBorder={i < MENU_ITEMS.length - 1}
                    onPress={() => {
                      if (item.route) navigation.navigate(item.route);
                      else item.onPress?.();
                    }}
                  />
                );
              })}
            </SettingsSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(350)} style={styles.sectionGap}>
            <SettingsSection label="Account" noTopMargin>
              <NavInfoRow
                title="Sign Out"
                icon="log-out-outline"
                iconColor={COLORS.text.secondary}
                onPress={logout}
                showBorder
              />
              <NavInfoRow
                title="Delete Account"
                icon="trash-outline"
                iconColor={COLORS.red}
                titleStyle={{ color: COLORS.red }}
                onPress={handleDeleteAccount}
              />
            </SettingsSection>
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
  scroll: TAB_SCROLL_CONTENT,
  sectionGap: { marginTop: SPACING.lg },

  identityBlock: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: COLORS.glass.bg,
  },
  rankText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border.hairline,
    marginVertical: SPACING.xs,
  },

  xpInner: {
    padding: SPACING.base,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    minHeight: 22,
  },
  xpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  xpTitle: {
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
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  xpFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 4,
  },
  xpSubline: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

  premiumBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  premiumIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#fff',
  },
  premiumSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },

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
    letterSpacing: TRACKING.label,
  },
});
