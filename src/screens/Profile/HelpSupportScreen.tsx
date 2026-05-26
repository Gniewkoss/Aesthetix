import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

const FAQ_ITEMS = [
  {
    q: 'How often should I scan?',
    a: 'For best progress tracking, scan once per day in consistent lighting and pose. Free users get 1 scan per day; Premium users have unlimited scans.',
  },
  {
    q: 'How is my physique score calculated?',
    a: 'Our AI evaluates visible muscle groups, proportions, symmetry, body composition, and posture from your photos to produce an overall score and detailed breakdown.',
  },
  {
    q: 'How do XP and ranks work?',
    a: 'You earn XP from scans and milestones. Every 500 XP increases your level. Ranks (Beginner → Legendary) unlock at higher XP thresholds and appear on your profile.',
  },
  {
    q: 'Can I delete my data?',
    a: 'Yes. Go to Privacy & Data on your profile to delete your account, which permanently removes all scans and progress from our servers.',
  },
];

const SUPPORT_EMAIL = 'support@physiquemax.ai';

export function HelpSupportScreen({ navigation }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(0);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader variant="push" title="Help & Support" subtitle="FAQ and contact" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard style={{ marginBottom: SPACING.base }}>
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = expandedId === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setExpandedId(isOpen ? null : i)}
                    style={[styles.faqRow, i < FAQ_ITEMS.length - 1 && styles.rowBorder]}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    accessibilityLabel={item.q}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{item.q}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={COLORS.text.muted}
                      />
                    </View>
                    {isOpen && <Text style={styles.faqAnswer}>{item.a}</Text>}
                  </TouchableOpacity>
                );
              })}
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <GradientButton
              title="Email Support"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              variant="secondary"
              size="md"
            />
            <Text style={styles.emailHint}>{SUPPORT_EMAIL}</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING['3xl'] },
  faqRow: { paddingVertical: 14 },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.hairline,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  faqAnswer: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: SPACING.sm,
    lineHeight: FONTS.sizes.sm * 1.5,
  },
  emailHint: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    marginTop: SPACING.md,
  },
});
