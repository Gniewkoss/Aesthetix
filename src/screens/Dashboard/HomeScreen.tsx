import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { GradientButton } from '../../components/ui/GradientButton';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { CoachBubble } from '../../components/onboarding/CoachBubble';
import { FirstRunChecklist } from '../../components/onboarding/FirstRunChecklist';
import {
  COLORS,
  FONT_FAMILY,
  FONTS,
  RADIUS,
  SPACING,
  TRACKING,
  getScoreColor,
  getScoreLabel,
} from '../../theme';
import { RANK_CONFIG, MUSCLE_GROUP_META } from '../../constants';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const XP_PER_LEVEL = 500;

type DiscoveryItem = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  desc: string;
};

const DISCOVERY: DiscoveryItem[] = [
  { icon: 'analytics-outline', color: COLORS.accent,  title: 'Physique Score',  desc: 'AI rates your overall physique 0–100' },
  { icon: 'body-outline',       color: COLORS.indigo,  title: '11 Muscle Groups', desc: 'Chest, back, arms, legs analyzed'      },
  { icon: 'fitness-outline',    color: COLORS.green,   title: 'Action Plan',     desc: 'Personalized training & diet tips'      },
];

const TRAINING_TIPS = [
  'Progressive overload is king. Add 2.5 kg to your compound lifts every 1–2 weeks.',
  'Sleep 7–9 hrs. Growth hormone peaks during deep sleep — this is when you grow.',
  'Protein targets: 1.6–2.2g per kg bodyweight. Spread it across 3–4 meals.',
  'V-taper starts in the gym but finishes in the kitchen. Body fat < 12% reveals the shape.',
  "Rear delts are most athletes' most undertrained muscle. Add face-pulls 3× per week.",
];

const dailyTip = TRAINING_TIPS[new Date().getDay() % TRAINING_TIPS.length];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { history, setCurrentAnalysis } = useAnalysisStore();
  const { hydrate, isHydrated, coachStep } = useOnboardingStore();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, []);

  const latestAnalysis = history[0] ?? null;
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;
  const hasScan = history.length > 0;

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpProgress = xpInLevel / XP_PER_LEVEL;

  const scannedToday = (() => {
    if (!latestAnalysis) return false;
    return new Date(latestAnalysis.createdAt).toDateString() === new Date().toDateString();
  })();

  // ── Animated XP bar via onLayout ────────────────────────────────────────────
  const xpBarFill  = useSharedValue(0);
  const xpBarStyle = useAnimatedStyle(() => ({ width: xpBarFill.value }));

  const handleXpLayout = (e: LayoutChangeEvent) => {
    const trackW = e.nativeEvent.layout.width;
    xpBarFill.value = withTiming(trackW * xpProgress, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  };

  // ── Pulse glow for scan CTA ──────────────────────────────────────────────────
  const glowOpacity = useSharedValue(0.18);
  useEffect(() => {
    if (!hasScan && coachStep === 'scan') {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.55, { duration: 1200 }),
          withTiming(0.18, { duration: 1200 }),
        ),
        -1, false,
      );
    } else {
      glowOpacity.value = withTiming(0.18, { duration: 400 });
    }
  }, [hasScan, coachStep]);

  const scanGlowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(59,130,246,${glowOpacity.value})`,
  }));

  const handleViewReport = () => {
    if (latestAnalysis) {
      setCurrentAnalysis(latestAnalysis);
      navigation.navigate('Dashboard', { analysisId: latestAnalysis.id });
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >

          {/* ── Brand row ────────────────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.brandRow}>
            <AesthetixLogo variant="wordmark" width={104} color={COLORS.cream} />
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </Animated.View>

          {/* ── Header ──────────────────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <View>
              <Text style={styles.greetingLabel}>
                {scannedToday ? 'SCANNED TODAY' : 'READY TO OPTIMIZE'}
              </Text>
              <Text style={styles.greeting}>{user?.name ?? 'Athlete'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium')}
              style={styles.premiumBadge}
            >
              {user?.isPremium ? (
                <LinearGradient
                  colors={['#92400E', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumInner}
                >
                  <Ionicons name="flash" size={10} color="#000" />
                  <Text style={styles.premiumText}>PRO</Text>
                </LinearGradient>
              ) : (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>FREE</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── First-run checklist ─────────────────────────────── */}
          {isHydrated && (
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <FirstRunChecklist hasScan={hasScan} />
            </Animated.View>
          )}

          {/* ── Stats + XP ──────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={16} color={COLORS.amber} />
                <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons
                  name={(rankConfig?.icon ?? 'leaf-outline') as any}
                  size={16}
                  color={rankConfig?.color ?? COLORS.text.muted}
                />
                <Text style={[styles.statValue, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                  {user?.rank ?? 'Beginner'}
                </Text>
                <Text style={styles.statLabel}>Rank</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="flash" size={16} color={COLORS.accent} />
                <Text style={styles.statValue}>{xp}</Text>
                <Text style={styles.statLabel}>XP</Text>
              </View>
            </View>

            {/* XP progress bar */}
            <View style={styles.xpSection}>
              <View style={styles.xpLabelRow}>
                <Text style={styles.xpLevelLabel}>Level {level}</Text>
                <Text style={styles.xpCount}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
              </View>
              {/* Track with onLayout triggers animation once width is known */}
              <View style={styles.xpTrack} onLayout={handleXpLayout}>
                <Animated.View style={[styles.xpFill, xpBarStyle]} />
              </View>
            </View>
          </Animated.View>

          {/* ── Latest Scan ─────────────────────────────────────── */}
          {latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(140).duration(400)}>
              <Text style={styles.sectionLabel}>LATEST SCAN</Text>
              <TouchableOpacity onPress={handleViewReport} activeOpacity={0.78}>
                <View
                  style={[
                    styles.latestCard,
                    { borderColor: getScoreColor(latestAnalysis.overallScore) + '20' },
                  ]}
                >
                  {/* Tinted top accent line */}
                  <View
                    style={[
                      styles.latestCardAccent,
                      { backgroundColor: getScoreColor(latestAnalysis.overallScore) + '30' },
                    ]}
                  />
                  <CircularProgress
                    score={latestAnalysis.overallScore}
                    size={110}
                    strokeWidth={9}
                    showLabel={false}
                  />
                  <View style={styles.latestInfo}>
                    <Text style={styles.latestTitle}>Physique Score</Text>
                    <Text style={[styles.latestScoreLabel, { color: getScoreColor(latestAnalysis.overallScore) }]}>
                      {getScoreLabel(latestAnalysis.overallScore)}
                    </Text>
                    <Text style={styles.latestDate}>
                      {new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </Text>
                    <View style={styles.latestTags}>
                      <View style={styles.latestTag}>
                        <Text style={styles.latestTagText}>BF {latestAnalysis.bodyFat}%</Text>
                      </View>
                      <View style={styles.latestTag}>
                        <Text style={styles.latestTagText}>V-Taper {latestAnalysis.vTaperScore}</Text>
                      </View>
                    </View>
                    <View style={styles.viewReportRow}>
                      <Text style={styles.viewReport}>View full report</Text>
                      <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Scan CTA ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.sectionLabel}>AESTHETIX SCAN</Text>
            <Animated.View
              style={[
                styles.scanCard,
                !hasScan && coachStep === 'scan' && styles.scanCardHighlight,
                !hasScan && coachStep === 'scan' && scanGlowStyle,
              ]}
            >
              <View style={styles.scanCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scanTitle}>
                    {hasScan ? 'Scan Again' : 'Start Your First Scan'}
                  </Text>
                  <Text style={styles.scanSub}>
                    {user?.isPremium
                      ? 'Unlimited scans · PRO active'
                      : !hasScan
                        ? 'Upload front + side photos · 60 seconds'
                        : `${Math.max(0, (user?.maxScansPerDay ?? 1) - (user?.scansToday ?? 0))} scan remaining today`}
                  </Text>
                </View>
                <View style={styles.scanIconWrap}>
                  <Ionicons name="scan-outline" size={20} color={COLORS.cream} />
                </View>
              </View>
              <GradientButton
                title={hasScan ? 'New Scan' : 'Start AI Scan'}
                onPress={() => navigation.navigate('Upload')}
                size="md"
                variant={hasScan ? 'primary' : 'brand'}
                style={{ marginTop: SPACING.base }}
                trailingIcon={
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={hasScan ? '#fff' : '#060609'}
                  />
                }
              />
            </Animated.View>
          </Animated.View>

          {/* ── Discovery cards (new user) ───────────────────────── */}
          {!hasScan && (
            <Animated.View entering={FadeInDown.delay(260).duration(400)}>
              <Text style={styles.sectionLabel}>WHAT YOU'LL GET</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.discoveryScroll}
              >
                {DISCOVERY.map((item) => (
                  <View key={item.title} style={styles.discoveryCard}>
                    <View
                      style={[
                        styles.discoveryIconWrap,
                        { borderColor: item.color + '30', backgroundColor: item.color + '10' },
                      ]}
                    >
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={styles.discoveryTitle}>{item.title}</Text>
                    <Text style={styles.discoveryDesc}>{item.desc}</Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* ── Priority Areas ──────────────────────────────────── */}
          {latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(260).duration(400)}>
              <Text style={styles.sectionLabel}>PRIORITY AREAS</Text>
              <View style={styles.priorityGrid}>
                {latestAnalysis.priorityAreas.slice(0, 4).map((area, i) => {
                  const meta  = MUSCLE_GROUP_META[area as keyof typeof MUSCLE_GROUP_META];
                  const score = latestAnalysis.muscleGroups[area as keyof typeof latestAnalysis.muscleGroups]?.score ?? 0;
                  const col   = getScoreColor(score);
                  return (
                    <View key={i} style={[styles.priorityCell, { borderColor: col + '20' }]}>
                      <View style={[styles.priorityIconWrap, { borderColor: col + '28', backgroundColor: col + '0D' }]}>
                        <Ionicons name={(meta?.icon ?? 'barbell-outline') as any} size={18} color={col} />
                      </View>
                      <Text style={styles.priorityName}>{meta?.label ?? area}</Text>
                      <Text style={[styles.priorityScore, { color: col }]}>{score}</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Streak reminder ─────────────────────────────────── */}
          {hasScan && !scannedToday && (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Upload')}
                activeOpacity={0.78}
                style={styles.streakReminder}
              >
                <View style={styles.streakReminderLeft}>
                  <Ionicons name="flame" size={18} color={COLORS.amber} />
                  <View>
                    <Text style={styles.streakReminderTitle}>
                      Keep your {user?.streak ?? 0}-day streak
                    </Text>
                    <Text style={styles.streakReminderSub}>Scan today before midnight</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.amber} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Daily Training Tip ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIconWrap}>
                <Ionicons name="bulb-outline" size={14} color={COLORS.amber} />
              </View>
              <Text style={styles.insightTitle}>Daily Tip</Text>
              <View style={styles.insightBadge}>
                <Text style={styles.insightBadgeText}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.insightText}>{dailyTip}</Text>
          </Animated.View>

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>

        <CoachBubble />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.base },

  // ── Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  aiBadge: {
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    backgroundColor: COLORS.creamDim,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  aiBadgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
    letterSpacing: 1.4,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greetingLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
    letterSpacing: TRACKING.caps,
    marginBottom: 4,
    opacity: 0.7,
  },
  greeting: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
  },
  premiumBadge: { borderRadius: RADIUS.sm, overflow: 'hidden' },
  premiumInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  premiumText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#000',
    letterSpacing: TRACKING.caps,
  },
  freeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  freeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
  },

  // ── Stats card
  statsCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 4,
  },

  // ── XP bar
  xpSection: {
    gap: 6,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLevelLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
    letterSpacing: TRACKING.label,
  },
  xpCount: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  xpTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    minWidth: 4,
    // Subtle glow on the fill
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  // ── Section label
  sectionLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.caps,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xl,
  },

  // ── Latest scan card
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: 10,
    overflow: 'hidden',
  },
  latestCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  latestInfo: { flex: 1, gap: 3 },
  latestTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  latestScoreLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
  },
  latestDate: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  latestTags: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },
  latestTag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  latestTagText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
  },
  viewReportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: SPACING.sm,
  },
  viewReport: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
  },

  // ── Scan CTA
  scanCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    marginBottom: 10,
  },
  scanCardHighlight: {
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentDim,
  },
  scanCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  scanTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONT_FAMILY.heading,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  scanSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 3,
  },
  scanIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.creamDim,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Discovery (new user)
  discoveryScroll: {
    paddingRight: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: 10,
  },
  discoveryCard: {
    width: 148,
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  discoveryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.label,
  },
  discoveryDesc: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    lineHeight: FONTS.sizes.xs * 1.65,
  },

  // ── Priority Areas
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: 10,
  },
  priorityCell: {
    width: '47.5%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  priorityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityName: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  priorityScore: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },

  // ── Streak reminder
  streakReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    padding: SPACING.base,
    marginBottom: 10,
  },
  streakReminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  streakReminderTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.amber,
  },
  streakReminderSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.amber,
    opacity: 0.7,
    marginTop: 2,
  },

  // ── Daily tip
  insightCard: {
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    padding: SPACING.base,
    marginBottom: 10,
    gap: SPACING.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  insightIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.amber,
  },
  insightBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  insightBadgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.amber,
    opacity: 0.8,
  },
  insightText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.65,
  },
});
