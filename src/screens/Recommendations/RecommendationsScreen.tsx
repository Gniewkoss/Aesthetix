import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation, useRoute, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CoachTab, MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useAuthStore } from '../../store/useAuthStore';
import { hasAiCoachChat } from '../../subscription/tiers';
import { PlanTierBadge } from '../../components/obsidian/PlanTierBadge';
import { navigateToUpgrade } from '../../navigation/navigateToUpgrade';
import { C, T, R, S, LAYOUT, E, BTN_LABEL } from '../../theme/obsidian';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { PressableScale } from '../Dashboard/home/PressableScale';
import { VoltRing } from '../Dashboard/home/VoltRing';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { SegmentedControl } from '../Progress/progress/SegmentedControl';
import { PlanView } from './coach/PlanView';
import { ChatView } from './coach/ChatView';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Recommendations'>,
  NativeStackNavigationProp<RootStackParamList>
>;
type Tab = CoachTab;

const SEGMENTS = [
  { key: 'plan', label: 'Plan' },
  { key: 'chat', label: 'Chat' },
];

export function RecommendationsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<MainTabParamList, 'Recommendations'>>();
  const reduceMotion = useReducedMotion();
  const { currentAnalysis, history, hydrate, historyHydrated } = useAnalysisStore();
  const tier = useAuthStore((s) => s.user?.subscriptionTier ?? 'free');
  const chatUnlocked = hasAiCoachChat(tier);
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const planOpacity = useSharedValue(1);
  const chatOpacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      if (!historyHydrated || (!currentAnalysis && history.length === 0)) {
        void hydrate();
      }
    }, [historyHydrated, currentAnalysis, history.length, hydrate]),
  );

  const switchTab = useCallback((tab: string) => {
    const t = tab as Tab;
    if (t === activeTab) return;
    if (t !== 'chat') Keyboard.dismiss();
    setActiveTab(t);

    cancelAnimation(planOpacity);
    cancelAnimation(chatOpacity);

    const easing = Easing.out(Easing.cubic);
    const duration = reduceMotion ? 0 : 180;
    planOpacity.value = withTiming(t === 'plan' ? 1 : 0, { duration, easing });
    chatOpacity.value = withTiming(t === 'chat' ? 1 : 0, { duration, easing });
  }, [activeTab, reduceMotion]);

  const planStyle = useAnimatedStyle(() => ({ opacity: planOpacity.value }));
  const chatStyle = useAnimatedStyle(() => ({ opacity: chatOpacity.value }));

  useFocusEffect(
    useCallback(() => {
      const tab = route.params?.tab;
      if (tab !== 'plan' && tab !== 'chat') return;
      switchTab(tab);
      navigation.setParams({ tab: undefined });
    }, [route.params?.tab, switchTab, navigation]),
  );

  const analysis = currentAnalysis ?? (history.length > 0 ? history[0] : null);

  // ── Empty state ──────────────────────────────────────────────
  if (!analysis) {
    return (
      <View style={styles.root}>
        <AmbientGlow />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.headerPad}>
            <Text style={[T.h1, { color: C.text }]}>AI Coach</Text>
            <Text style={[T.bodySm, { color: C.text2 }]}>Personalized coaching</Text>
          </View>
          <View style={styles.empty}>
            <VoltRing score={0} size={108} strokeWidth={8} instant>
              <Ionicons name="flash-outline" size={30} color={C.volt} />
            </VoltRing>
            <Text style={[T.title, { color: C.text, textAlign: 'center', marginTop: S.xl }]}>No scan data yet</Text>
            <Text style={[T.body, { color: C.text2, textAlign: 'center', marginTop: S.sm }]}>
              Complete your first physique scan to unlock your{'\n'}AI improvement plan and coach chat.
            </Text>
            <PressableScale onPress={() => navigation.navigate('Upload')} accessibilityLabel="Start first scan" style={[styles.cta, E.glow]}>
              <Text style={[BTN_LABEL, { color: C.voltInk }]}>Start first scan</Text>
              <Ionicons name="arrow-forward" size={16} color={C.voltInk} />
            </PressableScale>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Populated ────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[T.h1, { color: C.text }]}>AI Coach</Text>
            <Text style={[T.bodySm, { color: C.text2 }]}>
              {chatUnlocked ? 'Plan & coach chat' : 'Improvement plan · Chat on Max'}
            </Text>
          </View>
          <PlanTierBadge tier={tier} />
        </View>

        {/* Tabs */}
        <View style={styles.switcher}>
          <SegmentedControl options={SEGMENTS} value={activeTab} onChange={switchTab} reduceMotion={reduceMotion} />
        </View>

        {/* Content — both tabs stay mounted for smooth crossfade */}
        <View style={styles.content}>
          <Animated.View
            style={[styles.tabPane, planStyle]}
            pointerEvents={activeTab === 'plan' ? 'auto' : 'none'}
          >
            <PlanView analysis={analysis} reduceMotion={reduceMotion} />
          </Animated.View>
          <Animated.View
            style={[styles.tabPane, chatStyle]}
            pointerEvents={activeTab === 'chat' ? 'auto' : 'none'}
          >
            {chatUnlocked ? (
              <ChatView analysis={analysis} reduceMotion={reduceMotion} />
            ) : (
              <View style={styles.chatLocked}>
                <Ionicons name="lock-closed-outline" size={28} color={C.volt} />
                <Text style={[T.title, { color: C.text, textAlign: 'center', marginTop: S.lg }]}>AI coach chat</Text>
                <Text style={[T.body, { color: C.text2, textAlign: 'center', marginTop: S.sm }]}>
                  The Max plan unlocks unlimited coach chat based on your scan.
                </Text>
                <PressableScale
                  onPress={() => navigateToUpgrade(navigation, { reason: 'ai_coach', suggestedPlan: 'max' })}
                  accessibilityLabel="View Max plan"
                  style={[styles.cta, E.glow, { marginTop: S.xl }]}
                >
                  <Text style={[BTN_LABEL, { color: C.voltInk }]}>Get Max plan</Text>
                </PressableScale>
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.sm,
    marginBottom: LAYOUT.cardPad,
    gap: S.md,
  },
  headerPad: { paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, gap: 2 },
  switcher: { paddingHorizontal: LAYOUT.screenX, marginBottom: LAYOUT.cardPad },

  content: { flex: 1 },
  tabPane: { ...StyleSheet.absoluteFillObject },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: 112,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    height: 52,
    paddingHorizontal: S.xl,
    borderRadius: R.md,
    backgroundColor: C.volt,
    marginTop: S['2xl'],
  },
  chatLocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: 112,
  },
});
