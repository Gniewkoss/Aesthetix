import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { useSettingsStore, NotificationSettings } from '../../store/useSettingsStore';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const NOTIFICATION_OPTIONS: {
  key: keyof NotificationSettings;
  title: string;
  description: string;
}[] = [
  {
    key: 'scanReminders',
    title: 'Daily Scan Reminders',
    description: 'Get reminded to complete your daily physique scan',
  },
  {
    key: 'streakReminders',
    title: 'Streak Alerts',
    description: 'Notifications when your scan streak is at risk',
  },
  {
    key: 'progressUpdates',
    title: 'Progress Updates',
    description: 'Weekly summaries of score changes and milestones',
  },
];

export function NotificationsScreen({ navigation }: Props) {
  const notifications = useSettingsStore((s) => s.settings.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader variant="push" title="Notifications" subtitle="Manage your alerts" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard>
              {NOTIFICATION_OPTIONS.map((item, i) => (
                <View
                  key={item.key}
                  style={[styles.row, i < NOTIFICATION_OPTIONS.length - 1 && styles.rowBorder]}
                >
                  <View style={styles.rowContent}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                  <Switch
                    value={notifications[item.key]}
                    onValueChange={(value) => setNotification(item.key, value)}
                    trackColor={{ false: 'rgba(255,255,255,0.12)', true: COLORS.accent }}
                    thumbColor="#fff"
                    ios_backgroundColor="rgba(255,255,255,0.12)"
                  />
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          <Text style={styles.hint}>
            Push notifications require device permissions. Your preferences are saved on this device.
          </Text>
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
    borderBottomColor: COLORS.border.hairline,
  },
  rowContent: { flex: 1, paddingRight: SPACING.sm },
  title: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  description: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 3,
    lineHeight: FONTS.sizes.xs * 1.45,
  },
  hint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: FONTS.sizes.xs * 1.5,
    paddingHorizontal: SPACING.md,
  },
});
