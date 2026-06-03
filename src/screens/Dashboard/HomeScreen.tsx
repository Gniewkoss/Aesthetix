import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { navigateToUpgrade } from '../../navigation/navigateToUpgrade';
import { StreakPillTap } from './home/StreakPillTap';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { RANK_CONFIG } from '../../constants';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { ScoreHero } from './home/ScoreHero';
import { StatStrip } from './home/StatStrip';
import { FocusRail } from './home/FocusRail';
import { NudgeCard } from './home/NudgeCard';
import { PressableScale } from './home/PressableScale';
import { PlanTierBadge } from '../../components/obsidian/PlanTierBadge';
import { AmbientGlow } from './home/AmbientGlow';
import { useReducedMotion } from './home/useReducedMotion';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const XP_PER_LEVEL = 500;
const TAB_CLEARANCE = 112;

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const TRAINING_TIPS = [
  'Progressive overload is king. Add 2.5 kg to your compound lifts every 1–2 weeks.',
  'Sleep 7–9 hrs. Growth hormone peaks during deep sleep — this is when you grow.',
  'Protein targets: 1.6–2.2 g per kg bodyweight. Spread it across 3–4 meals.',
  'V-taper starts in the gym but finishes in the kitchen. Body fat < 12% reveals the shape.',
  "Rear delts are most athletes' most undertrained muscle. Add face-pulls 3× per week.",
];
const dailyTip = TRAINING_TIPS[new Date().getDay() % TRAINING_TIPS.length];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const reduceMotion = useReducedMotion();
  const { user } = useAuthStore();
  const { history, historyHydrated, setCurrentAnalysis } = useAnalysisStore();
  const { hydrate, isHydrated } = useOnboardingStore();

  useEffect(() => { if (!isHydrated) hydrate(); }, []);

  const latestAnalysis = history[0] ?? null;
  const hasScan = history.length > 0;
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpInLevel = xp % XP_PER_LEVEL;

  const scannedToday = latestAnalysis
    ? new Date(latestAnalysis.createdAt).toDateString() === new Date().toDateString()
    : false;

  const handleViewReport = () => {
    if (latestAnalysis) {
      setCurrentAnalysis(latestAnalysis);
      navigation.navigate('Dashboard', { analysisId: latestAnalysis.id });
    }
  };
  const goScan = () => navigation.navigate('Upload');
  const goPremium = () => navigateToUpgrade(navigation, { reason: 'generic' });

  // Staggered entrance — disabled under reduced motion.
  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <View style={styles.root}>
      {/* Ambient Volt bloom behind the header — soft radial falloff */}
      <AmbientGlow />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Header ───────────────────────────────── */}
          <Animated.View entering={enter(0)} style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[T.bodySm, { color: C.text2 }]}>{getTimeGreeting()}</Text>
              <Text style={[T.h1, { color: C.text }]} numberOfLines={1}>
                {user?.name?.split(' ')[0] ?? 'Athlete'}
              </Text>
            </View>

            <View style={styles.headerRight}>
              {hasScan && (
                <StreakPillTap streak={user?.streak ?? 0} reduceMotion={reduceMotion} />
              )}
              <PlanTierBadge
                tier={user?.subscriptionTier ?? 'free'}
                onPress={goPremium}
              />
            </View>
          </Animated.View>

          {/* ── Score hero ───────────────────────────── */}
          <Animated.View entering={enter(1)} style={styles.section}>
            <ScoreHero
              analysis={latestAnalysis}
              isHistoryLoading={!historyHydrated}
              reduceMotion={reduceMotion}
              onViewReport={handleViewReport}
              onNewScan={goScan}
              onStartScan={goScan}
            />
          </Animated.View>

          {/* ── Stat strip ───────────────────────────── */}
          {hasScan && (
            <Animated.View entering={enter(2)} style={styles.section}>
              <StatStrip
                streak={user?.streak ?? 0}
                rank={user?.rank ?? 'Beginner'}
                rankColor={rankConfig?.color ?? C.text2}
                rankIcon={rankConfig?.icon ?? 'leaf-outline'}
                xp={xp}
                level={level}
                xpInLevel={xpInLevel}
                xpPerLevel={XP_PER_LEVEL}
                reduceMotion={reduceMotion}
              />
            </Animated.View>
          )}

          {/* ── Focus areas ──────────────────────────── */}
          {latestAnalysis && latestAnalysis.priorityAreas.length > 0 && (
            <Animated.View entering={enter(3)} style={styles.section}>
              <Text style={[T.overline, styles.sectionLabel]}>FOCUS AREAS</Text>
              <FocusRail analysis={latestAnalysis} onPressArea={handleViewReport} />
            </Animated.View>
          )}

          {/* ── Streak nudge ─────────────────────────── */}
          {hasScan && !scannedToday && (
            <Animated.View entering={enter(4)} style={styles.section}>
              <NudgeCard
                icon="flame"
                accent={C.warning}
                title={`Keep your ${user?.streak ?? 0}-day streak`}
                subtitle="Scan before midnight to maintain it"
                ctaLabel="Scan now"
                onPress={goScan}
              />
            </Animated.View>
          )}

          {/* ── Daily tip ────────────────────────────── */}
          <Animated.View entering={enter(5)} style={styles.section}>
            <Text style={[T.overline, styles.sectionLabel]}>DAILY TIP</Text>
            <View style={styles.tipCard}>
              <View style={styles.tipHead}>
                <Ionicons name="bulb-outline" size={14} color={C.volt} />
                <Text style={[T.label, { color: C.text }]}>Today's edge</Text>
              </View>
              <Text style={[T.body, { color: C.text2, marginTop: S.sm }]}>{dailyTip}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  scroll: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.sm,
    paddingBottom: TAB_CLEARANCE,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: LAYOUT.sectionGap,
  },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingTop: 4,
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  section: { marginBottom: LAYOUT.sectionGap },
  sectionLabel: { color: C.text3, marginBottom: S.md },

  tipCard: {
    backgroundColor: C.surface1,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: LAYOUT.cardPad,
  },
  tipHead: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
});
