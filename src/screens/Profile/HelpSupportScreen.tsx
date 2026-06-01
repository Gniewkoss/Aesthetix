import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { SUPPORT_EMAIL } from '../../constants/legal';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { TIMING_STD } from '../../motion';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { GroupCard } from '../../components/obsidian/GroupCard';
import { PressableScale } from '../Dashboard/home/PressableScale';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

const FAQ_ITEMS = [
  { q: 'How often should I scan?', a: 'For best progress tracking, scan once per day in consistent lighting and pose. Free users get 1 scan per day; Premium users have unlimited scans.' },
  { q: 'How is my physique score calculated?', a: 'Our AI evaluates visible muscle groups, proportions, symmetry, body composition, and posture from your photos to produce an overall score and detailed breakdown.' },
  { q: 'How do XP and ranks work?', a: 'You earn XP from scans and milestones. Every 500 XP increases your level. Ranks (Beginner → Legendary) unlock at higher XP thresholds and appear on your profile.' },
  { q: 'Can I delete my data?', a: 'Yes. Go to Privacy & Data on your profile to delete your account, which permanently removes all scans and progress from our servers.' },
];

function animateFaqLayout(reduceMotion: boolean) {
  if (reduceMotion) return;
  LayoutAnimation.configureNext({
    duration: TIMING_STD.duration,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

function FaqItem({
  item,
  open,
  showBorder,
  reduceMotion,
  onPress,
}: {
  item: (typeof FAQ_ITEMS)[number];
  open: boolean;
  showBorder: boolean;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const rotation = useSharedValue(open ? 180 : 0);

  useEffect(() => {
    rotation.value = reduceMotion
      ? (open ? 180 : 0)
      : withTiming(open ? 180 : 0, TIMING_STD);
  }, [open, reduceMotion, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={item.q}
      style={({ pressed }) => [showBorder && styles.border, pressed && styles.pressed]}
    >
      <View style={[styles.faqRow, open && styles.faqRowOpen]}>
        <View style={styles.faqHeader}>
          <Text style={[T.body, styles.faqQuestion]}>{item.q}</Text>
          <Animated.View style={[styles.chevron, chevronStyle]}>
            <Ionicons name="chevron-down" size={16} color={C.text3} />
          </Animated.View>
        </View>

        {open ? (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(TIMING_STD.duration)}
            exiting={reduceMotion ? undefined : FadeOut.duration(160)}
            style={styles.faqBody}
          >
            <Text style={[T.bodySm, styles.faqAnswer]}>{item.a}</Text>
          </Animated.View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function HelpSupportScreen({ navigation }: Props) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    Haptics.selectionAsync();
    animateFaqLayout(reduceMotion);
    setExpanded(expanded === index ? null : index);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Help & Support" subtitle="FAQ & contact" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(350)}>
            <GroupCard label="FAQ">
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem
                  key={item.q}
                  item={item}
                  open={expanded === i}
                  showBorder={i < FAQ_ITEMS.length - 1}
                  reduceMotion={reduceMotion}
                  onPress={() => toggleItem(i)}
                />
              ))}
            </GroupCard>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(80).duration(350)} style={styles.contactSection}>
            <PressableScale
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              accessibilityLabel="Email support"
              style={styles.emailBtn}
            >
              <View style={styles.emailBtnInner}>
                <Ionicons name="mail-outline" size={16} color={C.text} />
                <Text style={[T.label, { color: C.text }]}>Email support</Text>
              </View>
            </PressableScale>
            <Text style={[T.caption, styles.emailHint]}>{SUPPORT_EMAIL}</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },

  faqRow: {
    paddingVertical: S.base,
    paddingHorizontal: LAYOUT.cardPad,
  },
  faqRowOpen: {
    paddingBottom: S.lg,
  },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  pressed: { backgroundColor: C.surface2 },

  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
  },
  faqQuestion: {
    color: C.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  chevron: {
    marginTop: 3,
    flexShrink: 0,
  },
  faqBody: {
    marginTop: S.md,
  },
  faqAnswer: {
    color: C.text2,
    lineHeight: 22,
  },

  contactSection: { marginTop: S.sm },
  emailBtn: {
    height: 52,
    borderRadius: R.md,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.borderMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  emailHint: { color: C.text3, textAlign: 'center', marginTop: S.md },
});
