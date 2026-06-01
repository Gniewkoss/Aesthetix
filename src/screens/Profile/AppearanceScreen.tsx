import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAppTheme } from '../../theme/ThemeProvider';
import { type AppearanceMode } from '../../store/useSettingsStore';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Appearance'>;

const OPTIONS: { mode: AppearanceMode; title: string; subtitle: string }[] = [
  { mode: 'system', title: 'System', subtitle: 'Match iOS or Android setting' },
  { mode: 'dark', title: 'Dark', subtitle: 'Aesthetix dark theme' },
  { mode: 'light', title: 'Light', subtitle: 'High-contrast light theme' },
];

export function AppearanceScreen({ navigation }: Props) {
  const { appearance, setAppearance, scheme } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: COLORS.bg.primary },
        scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING['3xl'] },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.base,
          paddingHorizontal: SPACING.base,
          minHeight: LAYOUT.minTouchTarget,
        },
        rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border.hairline },
        rowText: { flex: 1, paddingRight: SPACING.md },
        rowTitle: { fontSize: FONTS.sizes.base, fontFamily: FONT_FAMILY.bodySemibold, color: COLORS.text.primary },
        rowSub: {
          fontSize: FONTS.sizes.sm,
          fontFamily: FONT_FAMILY.body,
          color: COLORS.text.muted,
          marginTop: 2,
        },
      }),
    [scheme],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader
          variant="push"
          title="Appearance"
          subtitle="Theme and display"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard>
              {OPTIONS.map((opt, i) => {
                const selected = appearance === opt.mode;
                return (
                  <TouchableOpacity
                    key={opt.mode}
                    style={[styles.row, i < OPTIONS.length - 1 && styles.rowBorder]}
                    onPress={() => setAppearance(opt.mode)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.title}. ${opt.subtitle}`}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{opt.title}</Text>
                      <Text style={styles.rowSub}>{opt.subtitle}</Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color={COLORS.text.disabled} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

