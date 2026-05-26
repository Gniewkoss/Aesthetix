import React, { useEffect } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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
import { TAB_SCROLL_CONTENT } from '../../components/common/tabScreenLayout';
import {
  COLORS,
  FONT_FAMILY,
  FONTS,
  GRADIENTS,
  LAYOUT,
  RADIUS,
  SPACING,
  TRACKING,
  getScoreColor,
  getScoreLabel,
} from '../../theme';
import { TIMING_FILL } from '../../motion';
import { RANK_CONFIG, MUSCLE_GROUP_META } from '../../constants';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const XP_PER_LEVEL = 500;

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Feature highlights shown on empty state
const FEATURES = [
  { icon: 'analytics-outline' as const, color: COLORS.accent,  title: 'Physique Score',   desc: 'AI rates your overall physique 0–100'  },
  { icon: 'body-outline'       as const, color: COLORS.indigo,  title: '11 Muscle Groups', desc: 'Each muscle individually analyzed'      },
  { icon: 'fitness-outline'    as const, color: COLORS.green,   title: 'Action Plan',      desc: 'Personalized training & diet program'  },
];

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
  const { user } = useAuthStore();
  const { history, setCurrentAnalysis } = useAnalysisStore();
  const { hydrate, isHydrated } = useOnboardingStore();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, []);

  const latestAnalysis = history[0] ?? null;
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;
  const hasScan = history.length > 0;
  const scoreColor = latestAnalysis ? getScoreColor(latestAnalysis.overallScore) : COLORS.accent;

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpProgress = xpInLevel / XP_PER_LEVEL;

  const scannedToday = (() => {
    if (!latestAnalysis) return false;
    return new Date(latestAnalysis.createdAt).toDateString() === new Date().toDateString();
  })();

  const xpBarFill  = useSharedValue(0);
  const xpBarStyle = useAnimatedStyle(() => ({ width: xpBarFill.value }));

  const handleXpLayout = (e: LayoutChangeEvent) => {
    const trackW = e.nativeEvent.layout.width;
    xpBarFill.value = withTiming(trackW * xpProgress, TIMING_FILL);
  };

  const handleViewReport = () => {
    if (latestAnalysis) {
      setCurrentAnalysis(latestAnalysis);
      navigation.navigate('Dashboard', { analysisId: latestAnalysis.id });
    }
  };

  const PremiumBadge = (
    <TouchableOpacity
      onPress={() => navigation.navigate('Premium')}
      style={styles.premiumBadge}
    >
      {user?.isPremium ? (
        <LinearGradient
          colors={GRADIENTS.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.premiumInner}
        >
          <Ionicons name="flash" size={10} color="#fff" />
          <Text style={styles.premiumText}>PRO</Text>
        </LinearGradient>
      ) : (
        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>FREE</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Compact single-row header — logo | badge ─── */}
        <View style={styles.header}>
          <AesthetixLogo variant="wordmark" width={88} color={COLORS.cream} />
          {PremiumBadge}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >

          {/* ── Greeting — first scroll element ─────────── */}
          <Animated.View entering={FadeInDown.delay(30).duration(350)} style={styles.greeting}>
            <Text style={styles.greetingLine}>
              {getTimeGreeting()},{' '}
              <Text style={styles.greetingName}>{user?.name ?? 'Athlete'}</Text>
            </Text>
            <Text style={styles.greetingStatus}>
              {scannedToday ? 'Scanned today · streak active' : hasScan ? 'Ready for another scan' : 'Start your first scan below'}
            </Text>
          </Animated.View>

          {/* ── First-run checklist (no scan only) ─────────── */}
          {isHydrated && !hasScan && (
            <Animated.View entering={FadeInDown.delay(40).duration(350)}>
              <FirstRunChecklist hasScan={hasScan} />
            </Animated.View>
          )}

          {/* ─────────────────────────────────────────────────
              EMPTY STATE — brand hero moment
          ───────────────────────────────────────────────── */}
          {!hasScan && (
            <Animated.View entering={FadeInDown.delay(70).duration(400)} style={styles.emptyHero}>
              {/* Diagonal cream sweep — brand geometry */}
              <LinearGradient
                colors={GRADIENTS.diagonalCream}
                start={{ x: 0.0, y: 1.0 }}
                end={{ x: 1.0, y: 0.0 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <Text style={styles.emptyEyebrow}>AESTHETIX AI</Text>
              <Text style={styles.emptyTitle}>{'Discover Your\nTrue Physique'}</Text>
              <Text style={styles.emptyBody}>
                AI-powered analysis in 60 seconds. Get your physique score, muscle breakdown, and personalized plan.
              </Text>

              {/* Feature list */}
              <View style={styles.featureList}>
                {FEATURES.map((item) => (
                  <View key={item.title} style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: item.color + '14', borderColor: item.color + '28' }]}>
                      <Ionicons name={item.icon} size={14} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>{item.title}</Text>
                      <Text style={styles.featureDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <GradientButton
                title="Start AI Scan"
                onPress={() => navigation.navigate('Upload')}
                variant="brand"
                size="lg"
                style={{ marginTop: SPACING.lg }}
                trailingIcon={<Ionicons name="arrow-forward" size={14} color={COLORS.bg.primary} />}
              />

              <Text style={styles.emptyMeta}>Front + side photos · 60 seconds</Text>
            </Animated.View>
          )}

          {/* ─────────────────────────────────────────────────
              SCORE HERO — primary data card for returning users
          ───────────────────────────────────────────────── */}
          {hasScan && latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(50).duration(400)}>
              <TouchableOpacity
                onPress={handleViewReport}
                activeOpacity={0.84}
                style={[styles.scoreCard, { borderColor: scoreColor + '22' }]}
              >
                {/* Left accent bar — score-tier colored */}
                <View style={[styles.scoreBar, { backgroundColor: scoreColor }]} />

                <View style={styles.scoreContent}>
                  <View style={styles.scoreMain}>
                    {/* Score column */}
                    <View style={styles.scoreLeft}>
                      <Text style={styles.scoreEyebrow}>PHYSIQUE SCORE</Text>
                      <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                        {latestAnalysis.overallScore}
                      </Text>
                      <Text style={[styles.scoreLabel, { color: scoreColor }]}>
                        {getScoreLabel(latestAnalysis.overallScore)}
                      </Text>
                      <View style={styles.scoreMeta}>
                        <Text style={styles.scoreMetaText}>
                          {new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </Text>
                        <View style={styles.scoreMetaDot} />
                        <Text style={styles.scoreMetaText}>
                          BF {latestAnalysis.bodyFatRange ?? `${latestAnalysis.bodyFat}%`}
                        </Text>
                        <View style={styles.scoreMetaDot} />
                        <Text style={styles.scoreMetaText}>
                          V-Taper {latestAnalysis.vTaperScore}
                        </Text>
                      </View>
                    </View>

                    {/* Compact ring */}
                    <CircularProgress
                      score={latestAnalysis.overallScore}
                      size={88}
                      strokeWidth={7}
                      showLabel={false}
                    />
                  </View>

                  {/* Footer: two actions */}
                  <View style={styles.scoreFooter}>
                    <View style={styles.scoreAction}>
                      <Text style={styles.scoreActionText}>View full report</Text>
                      <Ionicons name="chevron-forward" size={11} color={COLORS.cream} />
                    </View>
                    <View style={styles.scoreActionSpacer} />
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Upload')}
                      style={styles.scoreAction}
                      hitSlop={{ top: 14, bottom: 14 }}
                    >
                      <Ionicons name="add-circle-outline" size={13} color={COLORS.accent} />
                      <Text style={[styles.scoreActionText, { color: COLORS.accent }]}>New Scan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Stats + XP strip ─────────────────────────────── */}
          {hasScan && (
            <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="flame" size={14} color={COLORS.amber} />
                  <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
                  <Text style={styles.statLabel}>day streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons
                    name={(rankConfig?.icon ?? 'leaf-outline') as any}
                    size={14}
                    color={rankConfig?.color ?? COLORS.text.muted}
                  />
                  <Text style={[styles.statValue, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                    {user?.rank ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>rank</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="flash" size={14} color={COLORS.accent} />
                  <Text style={styles.statValue}>{xp}</Text>
                  <Text style={styles.statLabel}>XP</Text>
                </View>
              </View>

              {/* XP progress */}
              <View style={styles.xpSection}>
                <View style={styles.xpLabelRow}>
                  <Text style={styles.xpLevelLabel}>Level {level}</Text>
                  <Text style={styles.xpCount}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
                </View>
                <View style={styles.xpTrack} onLayout={handleXpLayout}>
                  <Animated.View style={[styles.xpFill, xpBarStyle]} />
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Priority Areas grid ──────────────────────────── */}
          {latestAnalysis && latestAnalysis.priorityAreas.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).duration(350)}>
              <Text style={styles.sectionTitle}>Priority Areas</Text>
              <View style={styles.priorityGrid}>
                {latestAnalysis.priorityAreas.slice(0, 4).map((area, i) => {
                  const meta  = MUSCLE_GROUP_META[area as keyof typeof MUSCLE_GROUP_META];
                  const score = latestAnalysis.muscleGroups[area as keyof typeof latestAnalysis.muscleGroups]?.score ?? 0;
                  const col   = getScoreColor(score);
                  return (
                    <View key={i} style={[styles.priorityCell, { borderColor: col + '1A' }]}>
                      <View style={[styles.priorityIconWrap, { backgroundColor: col + '10', borderColor: col + '25' }]}>
                        <Ionicons name={(meta?.icon ?? 'barbell-outline') as any} size={16} color={col} />
                      </View>
                      <Text style={styles.priorityName}>{meta?.label ?? area}</Text>
                      <Text style={[styles.priorityScore, { color: col }]}>{score}</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Streak reminder ──────────────────────────────── */}
          {hasScan && !scannedToday && (
            <Animated.View entering={FadeInDown.delay(170).duration(350)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Upload')}
                activeOpacity={0.82}
                style={styles.streakReminder}
              >
                <View style={styles.streakLeft}>
                  <Ionicons name="flame" size={18} color={COLORS.amber} />
                  <View>
                    <Text style={styles.streakTitle}>Keep your {user?.streak ?? 0}-day streak</Text>
                    <Text style={styles.streakSub}>Scan today before midnight</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.amber} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Daily Training Tip ───────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipEyebrow}>DAILY TIP</Text>
              <Text style={styles.tipDate}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.tipText}>{dailyTip}</Text>
          </Animated.View>

        </ScrollView>

        <CoachBubble />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  // ── Compact single-row header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.pagePad,
    paddingTop: SPACING.sm,             // 8px — safe area already applied by SafeAreaView
    paddingBottom: SPACING.base,        // 16px
  },

  scroll: {
    paddingHorizontal: LAYOUT.pagePad,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING['5xl'],
  },

  // ── Greeting
  greeting: {
    marginBottom: SPACING.lg,           // 20px below greeting
  },
  greetingLine: {
    fontSize: FONTS.sizes.base,         // 15 — readable but not dominant
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  greetingName: {
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  greetingStatus: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    marginTop: 2,
  },

  // ── Premium badge
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
    color: '#fff',
    letterSpacing: TRACKING.caps,
  },
  freeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  freeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
  },

  // ─────────────────────────────────────────────────
  // EMPTY HERO
  // ─────────────────────────────────────────────────
  emptyHero: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    padding: SPACING['2xl'],            // 32
    marginBottom: LAYOUT.cardGap,
    overflow: 'hidden',
  },
  emptyEyebrow: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
    letterSpacing: TRACKING.caps,
    opacity: 0.65,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.sizes['3xl'],       // 34
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['3xl'] * 1.08,
    marginBottom: SPACING.base,
  },
  emptyBody: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.65,
    marginBottom: SPACING.xl,
  },
  featureList: { gap: SPACING.md, marginBottom: SPACING.sm },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.primary,
  },
  featureDesc: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 1,
  },
  emptyMeta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  // ─────────────────────────────────────────────────
  // SCORE HERO CARD
  // ─────────────────────────────────────────────────
  scoreCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: LAYOUT.cardGap,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  // 4px left bar — score-tier color, full height
  scoreBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  scoreContent: {
    flex: 1,
    padding: LAYOUT.cardPad,            // 24
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  scoreLeft: { flex: 1 },
  scoreEyebrow: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
    marginBottom: SPACING.xs,
  },
  scoreNumber: {
    fontSize: FONTS.sizes['5xl'],       // 56 — the hero number
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['5xl'],
  },
  scoreLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
    marginTop: SPACING.xs,
  },
  scoreMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.sm,
  },
  scoreMetaText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  scoreMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.text.disabled,
  },
  // Footer — two action links separated by a spacer
  scoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.hairline,
  },
  scoreAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
  },
  scoreActionText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.cream,
    letterSpacing: TRACKING.label,
  },
  scoreActionSpacer: { flex: 1 },

  // ─────────────────────────────────────────────────
  // STATS + XP
  // ─────────────────────────────────────────────────
  statsCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    padding: SPACING.base,
    marginBottom: LAYOUT.cardGap,
    gap: SPACING.base,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
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
    height: 28,
    backgroundColor: COLORS.border.hairline,
  },

  // XP bar
  xpSection: { gap: 6 },
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
    height: 4,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.full,
    minWidth: 4,
  },

  // ─────────────────────────────────────────────────
  // PRIORITY AREAS
  // ─────────────────────────────────────────────────
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.heading,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,              // 24 breathing room before section
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: LAYOUT.cardGap,
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
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
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
    fontSize: FONTS.sizes.xl,          // 24
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },

  // ─────────────────────────────────────────────────
  // STREAK REMINDER
  // ─────────────────────────────────────────────────
  streakReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    padding: SPACING.base,
    marginBottom: LAYOUT.cardGap,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  streakTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.amber,
  },
  streakSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.amber,
    opacity: 0.7,
    marginTop: 2,
  },

  // ─────────────────────────────────────────────────
  // DAILY TIP
  // ─────────────────────────────────────────────────
  tipCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    padding: LAYOUT.cardPad,            // 24
    marginBottom: LAYOUT.cardGap,
    // Subtle amber left accent
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber + '50',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  tipEyebrow: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.amber,
    letterSpacing: TRACKING.caps,
  },
  tipDate: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  tipText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.65,
  },
});
