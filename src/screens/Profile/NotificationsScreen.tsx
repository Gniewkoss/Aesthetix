import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { InfoRow } from '../../components/common/InfoRow';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { useSettingsStore, NotificationSettings } from '../../store/useSettingsStore';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, SPACING } from '../../theme';

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
                <InfoRow
                  key={item.key}
                  title={item.title}
                  subtitle={item.description}
                  showBorder={i < NOTIFICATION_OPTIONS.length - 1}
                  rightContent={
                    <Switch
                      value={notifications[item.key]}
                      onValueChange={(value) => setNotification(item.key, value)}
                      trackColor={{ false: 'rgba(255,255,255,0.12)', true: COLORS.accent }}
                      thumbColor={COLORS.text.onAccent}
                      ios_backgroundColor="rgba(255,255,255,0.12)"
                      accessibilityLabel={item.title}
                    />
                  }
                />
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
  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING['3xl'] },
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
