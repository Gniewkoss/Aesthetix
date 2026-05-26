import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { REDESIGN } from '../../theme/redesign-new';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { COLORS, FONTS, SPACING, RADIUS, SHADOWS, LAYOUT } = REDESIGN;

interface MenuItem {
  icon: string;
  label: string;
  action: 'navigate' | 'logout';
  target?: keyof RootStackParamList;
}

export function ProfileScreenRedesign() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  const menuItems: MenuItem[] = [
    { icon: 'achievements-outline', label: 'Achievements', action: 'navigate', target: 'Achievements' },
    { icon: 'notifications-outline', label: 'Notifications', action: 'navigate', target: 'Notifications' },
    { icon: 'lock-outline', label: 'Privacy & Data', action: 'navigate', target: 'PrivacyData' },
    { icon: 'help-circle-outline', label: 'Help & Support', action: 'navigate', target: 'HelpSupport' },
    { icon: 'card-outline', label: 'Manage Subscription', action: 'navigate', target: 'ManageSubscription' },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.action === 'navigate' && item.target) {
      navigation.navigate(item.target as any);
    } else if (item.action === 'logout') {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageHeader variant="tab" title="Profile" subtitle="Your account" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* User Card */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.userCard}>
            <View style={styles.avatarBox}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Level</Text>
                  <Text style={styles.statValue}>{user?.level || '0'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Streak</Text>
                  <Text style={styles.statValue}>{user?.streak || '0'}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Menu Items */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i > 0 && { marginTop: SPACING.md }]}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Logout Button */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.logoutSection}>
            <Button
              variant="default"
              size="lg"
              onPress={() => handleMenuPress({ icon: '', label: '', action: 'logout' })}
              style={styles.logoutButton}
            >
              Sign Out
            </Button>
          </Animated.View>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },

  scroll: {
    padding: LAYOUT.screenPad,
    gap: SPACING.lg,
  },

  userCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
    alignItems: 'center',
  },

  avatarBox: {
    marginBottom: SPACING.lg,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  userInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  userName: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },

  userEmail: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    marginBottom: SPACING.lg,
  },

  userStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },

  statItem: {
    alignItems: 'center',
  },

  statLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs,
  },

  statValue: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.family.heading,
    color: COLORS.primary,
    fontWeight: '700',
  },

  menuItem: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },

  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },

  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuLabel: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  logoutSection: {
    marginTop: SPACING.xl,
  },

  logoutButton: {
    backgroundColor: COLORS.status.poor,
  },
});
