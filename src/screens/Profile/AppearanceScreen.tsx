import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/ThemeProvider';
import { type AppearanceMode } from '../../store/useSettingsStore';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { GroupCard } from '../../components/obsidian/GroupCard';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

type Props = NativeStackScreenProps<RootStackParamList, 'Appearance'>;

const OPTIONS: { mode: AppearanceMode; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { mode: 'system', icon: 'phone-portrait-outline', title: 'System', subtitle: 'Match iOS or Android setting' },
  { mode: 'dark', icon: 'moon-outline', title: 'Dark', subtitle: 'Aesthetix dark theme' },
  { mode: 'light', icon: 'sunny-outline', title: 'Light', subtitle: 'High-contrast light theme' },
];

export function AppearanceScreen({ navigation }: Props) {
  const { appearance, setAppearance } = useAppTheme();
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Appearance" subtitle="Theme & display" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(STAGGER)}>
            <GroupCard label="THEME">
              {OPTIONS.map((opt, i) => {
                const selected = appearance === opt.mode;
                return (
                  <Pressable
                    key={opt.mode}
                    onPress={() => { Haptics.selectionAsync(); setAppearance(opt.mode); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.title}. ${opt.subtitle}`}
                    style={({ pressed }) => [i < OPTIONS.length - 1 && styles.border, pressed && styles.pressed]}
                  >
                    <View style={styles.row}>
                      <View style={[styles.iconTile, selected ? styles.iconOn : styles.iconOff]}>
                        <Ionicons name={opt.icon} size={16} color={selected ? C.volt : C.text2} />
                      </View>
                      <View style={styles.info}>
                        <Text style={[T.body, { color: C.text, fontSize: 15 }]}>{opt.title}</Text>
                        <Text style={[T.caption, { color: C.text3, marginTop: 1 }]}>{opt.subtitle}</Text>
                      </View>
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={selected ? C.volt : C.text3}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </GroupCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const STAGGER = 350;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: LAYOUT.cardPad },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  pressed: { backgroundColor: C.surface2 },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconOn: { backgroundColor: C.voltDim, borderColor: C.voltBorder },
  iconOff: { backgroundColor: C.surface2, borderColor: C.border },
  info: { flex: 1, minWidth: 0 },
});
