import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import { RANK_CONFIG } from '../../constants';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;

  const xpInCurrentLevel = user ? user.xp % 500 : 0;
  const xpToNextLevel = 500;
  const xpProgress = xpInCurrentLevel / xpToNextLevel;

  const MENU_ITEMS = [
    { icon: 'trophy-outline', label: 'Achievements', onPress: () => {} },
    { icon: 'share-social-outline', label: 'Share Progress', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Data', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient colors={['rgba(123,47,190,0.2)', 'transparent']} style={styles.heroBg} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Profile header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.profileHeader}>
            <LinearGradient
              colors={rankConfig?.gradient ?? ['#444', '#666']}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'A'}</Text>
            </LinearGradient>
            <Text style={styles.userName}>{user?.name ?? 'Athlete'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            <View style={styles.rankRow}>
              <Text style={styles.rankIcon}>{rankConfig?.icon ?? '🌱'}</Text>
              <Text style={[styles.rankLabel, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                {user?.rank ?? 'Beginner'}
              </Text>
              <Text style={styles.rankLevel}>Lv.{user?.level ?? 1}</Text>
            </View>
          </Animated.View>

          {/* XP Progress */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <GlassCard style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>XP Progress</Text>
                <Text style={styles.xpValue}>{user?.xp ?? 0} XP</Text>
              </View>
              <View style={styles.xpTrack}>
                <LinearGradient
                  colors={['#7B2FBE', '#00F5FF']}
                  style={[styles.xpFill, { width: `${xpProgress * 100}%` as any }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.xpNext}>{xpInCurrentLevel}/{xpToNextLevel} XP to Level {(user?.level ?? 1) + 1}</Text>
            </GlassCard>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
            <GlassCard style={styles.statCard} padding={12}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} padding={12}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} padding={12}>
              <Text style={styles.statEmoji}>📈</Text>
              <Text style={styles.statValue}>+12</Text>
              <Text style={styles.statLabel}>Score Gain</Text>
            </GlassCard>
          </Animated.View>

          {/* Premium Banner */}
          {!user?.isPremium && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <TouchableOpacity onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#FF006E', '#7B2FBE', '#00F5FF']}
                  style={styles.premiumBanner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.premiumBannerText}>⚡ Upgrade to Premium</Text>
                  <Text style={styles.premiumBannerSub}>Unlimited scans • AI coach • Full reports</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" style={{ position: 'absolute', right: 16, top: '50%' }} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Menu */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <GlassCard style={{ marginBottom: SPACING.base }}>
              {MENU_ITEMS.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
                >
                  <Ionicons name={item.icon as any} size={20} color={COLORS.text.secondary} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.text.disabled} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GradientButton title="Sign Out" onPress={logout} variant="outline" size="md" />
          </Animated.View>

          <Text style={styles.version}>PhysiqueMax AI v1.0.0 • Built with ❤️ & GPT-4o</Text>

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  heroBg: { position: 'absolute', width: '150%', height: 350, top: -80, left: -50 },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING['2xl'] },
  profileHeader: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.base,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black, color: '#fff' },
  userName: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  userEmail: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  rankIcon: { fontSize: 18 },
  rankLabel: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold },
  rankLevel: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, fontWeight: FONTS.weights.semibold },
  xpCard: { marginBottom: SPACING.base },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  xpLabel: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, fontWeight: FONTS.weights.semibold },
  xpValue: { fontSize: FONTS.sizes.sm, color: COLORS.cyan, fontWeight: FONTS.weights.bold },
  xpTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.full,
    overflow: 'hidden', marginBottom: SPACING.sm,
  },
  xpFill: { height: '100%', borderRadius: RADIUS.full },
  xpNext: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted },
  premiumBanner: {
    borderRadius: RADIUS.xl, padding: SPACING.base, marginBottom: SPACING.base,
    paddingRight: SPACING['3xl'],
  },
  premiumBannerText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.black, color: '#fff' },
  premiumBannerSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  menuLabel: { flex: 1, color: COLORS.text.primary, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.medium },
  version: {
    textAlign: 'center', color: COLORS.text.disabled, fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xl, marginBottom: SPACING.base,
  },
});
