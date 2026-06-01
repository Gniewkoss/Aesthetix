import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useSettingsStore, NotificationSettings } from '../../store/useSettingsStore';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { GroupCard } from '../../components/obsidian/GroupCard';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const OPTIONS: { key: keyof NotificationSettings; icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { key: 'scanReminders', icon: 'alarm-outline', title: 'Daily scan reminders', description: 'Get reminded to complete your daily physique scan' },
  { key: 'streakReminders', icon: 'flame-outline', title: 'Streak alerts', description: 'Notifications when your scan streak is at risk' },
  { key: 'progressUpdates', icon: 'stats-chart-outline', title: 'Progress updates', description: 'Weekly summaries of score changes and milestones' },
];

export function NotificationsScreen({ navigation }: Props) {
  const reduceMotion = useReducedMotion();
  const notifications = useSettingsStore((s) => s.settings.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Notifications" subtitle="Manage your alerts" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(350)}>
            <GroupCard label="ALERTS">
              {OPTIONS.map((item, i) => (
                <View key={item.key} style={[styles.row, i < OPTIONS.length - 1 && styles.border]}>
                  <View style={styles.iconTile}>
                    <Ionicons name={item.icon} size={16} color={C.info} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[T.body, { color: C.text, fontSize: 15 }]}>{item.title}</Text>
                    <Text style={[T.caption, { color: C.text3, marginTop: 1 }]}>{item.description}</Text>
                  </View>
                  <Switch
                    value={notifications[item.key]}
                    onValueChange={(v) => setNotification(item.key, v)}
                    trackColor={{ false: 'rgba(255,255,255,0.12)', true: C.volt }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(255,255,255,0.12)"
                    accessibilityLabel={item.title}
                  />
                </View>
              ))}
            </GroupCard>
          </Animated.View>

          <Text style={[T.caption, styles.hint]}>
            Push notifications require device permissions. Your preferences are saved on this device.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: LAYOUT.cardPad },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: R.sm,
    backgroundColor: 'rgba(91,157,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(91,157,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  hint: { color: C.text3, textAlign: 'center', marginTop: S.sm, paddingHorizontal: S.md, lineHeight: 17 },
});
