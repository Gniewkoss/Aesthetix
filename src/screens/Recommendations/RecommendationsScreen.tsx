import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { C, T, R, S, LAYOUT, E } from '../../theme/obsidian';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { PressableScale } from '../Dashboard/home/PressableScale';
import { VoltRing } from '../Dashboard/home/VoltRing';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { SegmentedControl } from '../Progress/progress/SegmentedControl';
import { PlanView } from './coach/PlanView';
import { ChatView } from './coach/ChatView';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'plan' | 'chat';

const SEGMENTS = [
  { key: 'plan', label: 'Plan' },
  { key: 'chat', label: 'Chat' },
];

export function RecommendationsScreen() {
  const navigation = useNavigation<Nav>();
  const reduceMotion = useReducedMotion();
  const { currentAnalysis, loadHistory, history } = useAnalysisStore();
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const planOpacity = useSharedValue(1);
  const chatOpacity = useSharedValue(0);

  useEffect(() => {
    if (!currentAnalysis && history.length === 0) loadHistory();
  }, []);

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

  const analysis = currentAnalysis ?? (history.length > 0 ? history[history.length - 1] : null);

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
              <Text style={[T.label, { color: C.voltInk, fontSize: 15 }]}>Start first scan</Text>
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
            <Text style={[T.bodySm, { color: C.text2 }]}>Plan & coach chat</Text>
          </View>
          <View style={styles.maxPill}>
            <View style={styles.maxDot} />
            <Text style={[T.label, { color: C.volt }]}>Max</Text>
          </View>
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
            <ChatView analysis={analysis} reduceMotion={reduceMotion} />
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
  maxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.voltDim,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.voltBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 6,
  },
  maxDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },

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
});
