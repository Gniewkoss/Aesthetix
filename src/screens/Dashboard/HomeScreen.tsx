import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutChangeEvent,
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
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { CoachBubble } from '../../components/onboarding/CoachBubble';
import { FirstRunChecklist } from '../../components/onboarding/FirstRunChecklist';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionLabel } from '../../components/common/SectionLabel';
import { TAB_SCROLL_CONTENT } from '../../components/common/tabScreenLayout';
import {
  COLORS, FONT_FAMILY, FONTS, GRADIENTS, LAYOUT, RADIUS, SPACING, TRACKING, SHADOWS,
  getScoreColor, getScoreLabel,
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

// ─── Feature row for empty hero ───────────────────────────────────────────────
const FEATURES = [
  { icon: 'analytics-outline' as const, color: COLORS.accent,  label: 'AI Physique Score 0–100'      },
  { icon: 'body-outline'       as const, color: COLORS.indigo,  label: '11 muscle groups analyzed'    },
  { icon: 'fitness-outline'    as const, color: COLORS.green,   label: 'Personalized training plan'   },
  { icon: 'nutrition-outline'  as const, color: COLORS.amber,   label: 'Nutrition & diet protocol'    },
] as const;

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

  useEffect(() => { if (!isHydrated) hydrate(); }, []);

  const latestAnalysis = history[0] ?? null;
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;
  const hasScan = history.length > 0;
  const scoreColor = latestAnalysis ? getScoreColor(latestAnalysis.overallScore) : COLORS.accent;

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpProgress = xpInLevel / XP_PER_LEVEL;

  const scannedToday = latestAnalysis
    ? new Date(latestAnalysis.createdAt).toDateString() === new Date().toDateString()
    : false;

  const xpBarFill  = useSharedValue(0);
  const xpBarStyle = useAnimatedStyle(() => ({ width: xpBarFill.value }));

  const handleXpLayout = (e: LayoutChangeEvent) => {
    xpBarFill.value = withTiming(e.nativeEvent.layout.width * xpProgress, TIMING_FILL);
  };

  const handleViewReport = () => {
    if (latestAnalysis) {
      setCurrentAnalysis(latestAnalysis);
      navigation.navigate('Dashboard', { analysisId: latestAnalysis.id });
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <View style={styles.scrollHeader}>
            <PageHeader
              variant="tab"
              leftComponent={<AesthetixLogo variant="wordmark" width={88} color={COLORS.cream} />}
              rightComponent={
                <View style={styles.headerRight}>
                  {hasScan && (
                    <View style={styles.streakPill}>
                      <Ionicons name="flame" size={11} color={COLORS.amber} />
                      <Text style={styles.streakPillText}>{user?.streak ?? 0}</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
                    {user?.isPremium ? (
                      <LinearGradient
                        colors={GRADIENTS.premium}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.proBadge}
                      >
                        <Ionicons name="flash" size={9} color={COLORS.text.onAccent} />
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>FREE</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              }
              title={`${getTimeGreeting()}, ${user?.name?.split(' ')[0] ?? 'Athlete'}`}
              subtitle={
                scannedToday
                  ? 'Scanned today · streak active'
                  : hasScan
                    ? 'Ready for your next scan'
                    : 'Start your first AI analysis'
              }
            />
          </View>

          {/* ── First-run checklist ──────────────────── */}
          {isHydrated && !hasScan && (
            <Animated.View entering={FadeInDown.delay(40).duration(350)}>
              <FirstRunChecklist hasScan={hasScan} />
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════
              EMPTY STATE — 21st.dev premium hero
          ══════════════════════════════════════════ */}
          {!hasScan && (
            <Animated.View entering={FadeInDown.delay(60).duration(420)} style={styles.hero}>
              {/* Diagonal brand sweep */}
              <LinearGradient
                colors={['rgba(236,236,230,0.08)', 'rgba(59,130,246,0.04)', 'transparent']}
                start={{ x: 0.0, y: 1.0 }}
                end={{ x: 1.0, y: 0.0 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {/* Top-right blue accent */}
              <LinearGradient
                colors={['rgba(59,130,246,0.10)', 'transparent']}
                start={{ x: 1.0, y: 0.0 }}
                end={{ x: 0.4, y: 0.6 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Eyebrow badge */}
              <View style={styles.heroBadgeRow}>
                <Badge variant="secondary" size="sm">AESTHETIX AI</Badge>
                <Badge variant="success" size="sm" leadingDot>Live Analysis</Badge>
              </View>

              <Text style={styles.heroTitle}>{'Discover Your\nTrue Physique'}</Text>
              <Text style={styles.heroBody}>
                AI-powered physique analysis in 60 seconds. Get your score, muscle breakdown, and a personalized plan.
              </Text>

              {/* Feature grid — 2×2 */}
              <View style={styles.featureGrid}>
                {FEATURES.map((f) => (
                  <View key={f.label} style={styles.featureCell}>
                    <View style={[styles.featureIcon, { backgroundColor: f.color + '14', borderColor: f.color + '25' }]}>
                      <Ionicons name={f.icon} size={15} color={f.color} />
                    </View>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>

              <Button
                variant="default"
                size="lg"
                onPress={() => navigation.navigate('Upload')}
                trailingIcon={<Ionicons name="arrow-forward" size={15} color={COLORS.bg.primary} />}
                style={styles.heroCta}
              >
                Start AI Scan
              </Button>

              <Text style={styles.heroMeta}>Front + side photos · Free to try</Text>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════
              SCORE HERO — primary card for active users
          ══════════════════════════════════════════ */}
          {hasScan && latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(50).duration(400)}>
              <TouchableOpacity
                onPress={handleViewReport}
                activeOpacity={0.84}
              >
                <GlassCard style={[styles.scoreCard, { borderColor: scoreColor + '25' }]}>
                <View style={styles.scoreBody}>
                  <View style={styles.scoreTop}>
                    <View style={styles.scoreLeft}>
                      <Text style={styles.scoreEyebrow}>PHYSIQUE SCORE</Text>
                      <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                        {latestAnalysis.overallScore}
                      </Text>
                      <Badge
                        variant={latestAnalysis.overallScore >= 75 ? 'success' : latestAnalysis.overallScore >= 45 ? 'warning' : 'destructive'}
                        size="sm"
                        style={{ marginTop: 4 }}
                      >
                        {getScoreLabel(latestAnalysis.overallScore)}
                      </Badge>
                    </View>
                    <CircularProgress
                      score={latestAnalysis.overallScore}
                      size={76}
                      strokeWidth={6}
                      showLabel={false}
                    />
                  </View>

                  {/* Meta row */}
                  <View style={styles.scoreMeta}>
                    {[
                      { icon: 'calendar-outline' as const, label: new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                      { icon: 'body-outline'     as const, label: `BF ${latestAnalysis.bodyFatRange ?? `${latestAnalysis.bodyFat}%`}` },
                      { icon: 'resize-outline'   as const, label: `V-Taper ${latestAnalysis.vTaperScore}` },
                    ].map((m, i) => (
                      <React.Fragment key={m.label}>
                        {i > 0 && <View style={styles.metaDot} />}
                        <View style={styles.metaChip}>
                          <Ionicons name={m.icon} size={10} color={COLORS.text.disabled} />
                          <Text style={styles.metaText}>{m.label}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>

                  {/* Footer actions */}
                  <View style={styles.scoreFooter}>
                    <View style={styles.scoreAction}>
                      <Text style={styles.scoreActionText}>View full report</Text>
                      <Ionicons name="chevron-forward" size={11} color={COLORS.cream} />
                    </View>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Upload')}
                      style={styles.scoreAction}
                      hitSlop={{ top: 14, bottom: 14 }}
                    >
                      <Ionicons name="add-circle-outline" size={12} color={COLORS.accent} />
                      <Text style={[styles.scoreActionText, { color: COLORS.accent }]}>New Scan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Stats + XP ───────────────────────────── */}
          {hasScan && (
            <Animated.View entering={FadeInDown.delay(100).duration(350)}>
              <GlassCard style={styles.statsCard}>
              {/* Stat grid — 3 columns */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="flame" size={13} color={COLORS.amber} />
                    <Text style={[styles.statValue, { color: COLORS.amber }]}>{user?.streak ?? 0}</Text>
                  </View>
                  <Text style={styles.statLabel}>Day streak</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.stat}>
                  <View style={styles.statIconRow}>
                    <Ionicons
                      name={(rankConfig?.icon ?? 'leaf-outline') as any}
                      size={13}
                      color={rankConfig?.color ?? COLORS.text.muted}
                    />
                    <Text style={[styles.statValue, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                      {user?.rank ?? '—'}
                    </Text>
                  </View>
                  <Text style={styles.statLabel}>Rank</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.stat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="flash" size={13} color={COLORS.accent} />
                    <Text style={[styles.statValue, { color: COLORS.accent }]}>{xp}</Text>
                  </View>
                  <Text style={styles.statLabel}>Total XP</Text>
                </View>
              </View>

              {/* XP progress */}
              <View style={styles.xpSection}>
                <View style={styles.xpLabels}>
                  <Text style={styles.xpLevelLabel}>
                    Level {level}
                    <Text style={styles.xpLevelSub}> — {user?.rank ?? 'Beginner'}</Text>
                  </Text>
                  <Text style={styles.xpCount}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
                </View>
                <View style={styles.xpTrack} onLayout={handleXpLayout}>
                  <Animated.View style={[styles.xpFill, xpBarStyle]} />
                </View>
              </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* ── Priority Areas ───────────────────────── */}
          {latestAnalysis && latestAnalysis.priorityAreas.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).duration(350)}>
              <SectionLabel
                label={`Priority Areas · ${latestAnalysis.priorityAreas.slice(0, 4).length} focus zones`}
                tier="title"
              />
              <View style={styles.priorityGrid}>
                {latestAnalysis.priorityAreas.slice(0, 4).map((area, i) => {
                  const meta  = MUSCLE_GROUP_META[area as keyof typeof MUSCLE_GROUP_META];
                  const score = latestAnalysis.muscleGroups[area as keyof typeof latestAnalysis.muscleGroups]?.score ?? 0;
                  const col   = getScoreColor(score);
                  return (
                    <View key={i} style={[styles.priorityCell, { borderColor: col + '1A' }]}>
                      <LinearGradient
                        colors={[col + '10', 'transparent']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={[styles.priorityIcon, { backgroundColor: col + '14', borderColor: col + '28' }]}>
                        <Ionicons name={(meta?.icon ?? 'barbell-outline') as any} size={15} color={col} />
                      </View>
                      <Text style={styles.priorityName}>{meta?.label ?? area}</Text>
                      <Text style={[styles.priorityScore, { color: col }]}>{score}</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Streak reminder ──────────────────────── */}
          {hasScan && !scannedToday && (
            <Animated.View entering={FadeInDown.delay(170).duration(350)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Upload')}
                activeOpacity={0.82}
                style={styles.streakCard}
              >
                <View style={styles.streakCardLeft}>
                  <View style={styles.streakFlameWrap}>
                    <Ionicons name="flame" size={20} color={COLORS.amber} />
                  </View>
                  <View>
                    <Text style={styles.streakCardTitle}>Keep your {user?.streak ?? 0}-day streak</Text>
                    <Text style={styles.streakCardSub}>Scan before midnight to maintain it</Text>
                  </View>
                </View>
                <View style={styles.streakCta}>
                  <Text style={styles.streakCtaText}>Scan now</Text>
                  <Ionicons name="chevron-forward" size={13} color={COLORS.amber} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Daily Tip ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <SectionLabel label="Daily Tip" tier="title" />
            <GlassCard style={styles.tipCard}>
            <View style={styles.tipBody}>
              <View style={styles.tipHeader}>
                <View style={styles.tipEyebrowRow}>
                  <Ionicons name="bulb-outline" size={11} color={COLORS.amber} />
                  <Text style={styles.tipEyebrow}>DAILY TIP</Text>
                </View>
                <Text style={styles.tipDate}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.tipText}>{dailyTip}</Text>
            </View>
            </GlassCard>
          </Animated.View>

        </ScrollView>

        <CoachBubble />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 28,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
  },
  streakPillText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.amber,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  proBadgeText: {
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
  freeBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
  },

  scroll: { ...TAB_SCROLL_CONTENT, paddingTop: 0 },
  scrollHeader: { marginHorizontal: -LAYOUT.pagePad },

  // ══════════════════════════════════════════
  // EMPTY HERO — 21st.dev premium section style
  // ══════════════════════════════════════════
  hero: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.accent + '35',
    padding: SPACING['3xl'],
    marginBottom: LAYOUT.sectionGap,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.cream,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['4xl'] * 1.12,
    marginBottom: SPACING.lg,
  },
  heroBody: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.65,
    marginBottom: SPACING.xl,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  featureCell: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
    lineHeight: 15,
  },
  heroCta: {
    marginTop: SPACING.lg,
  },
  heroMeta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  // ══════════════════════════════════════════
  // SCORE HERO CARD
  // ══════════════════════════════════════════
  scoreCard: {
    marginBottom: LAYOUT.sectionGap,
    borderWidth: 1.5,
  },
  scoreBody: {},
  scoreTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  scoreLeft: { flex: 1, minWidth: 0 },
  scoreEyebrow: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
    marginBottom: SPACING.xs,
  },
  scoreNumber: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['4xl'] * FONTS.lineHeights.tight,
  },
  scoreMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: SPACING.base,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  metaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.text.disabled,
  },
  scoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
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

  // ── Stats + XP
  statsCard: {
    marginBottom: LAYOUT.sectionGap,
    gap: SPACING.base,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
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
    height: 30,
    backgroundColor: COLORS.border.hairline,
  },
  xpSection: { gap: 5 },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLevelLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
    letterSpacing: 0.2,
  },
  xpLevelSub: {
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  xpCount: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  xpTrack: {
    height: 3,
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

  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: LAYOUT.sectionGap,
  },
  priorityCell: {
    width: '47.5%',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
    overflow: 'hidden',
  },
  priorityIcon: {
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
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },

  // ── Streak card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    padding: SPACING.base,
    marginBottom: LAYOUT.sectionGap,
  },
  streakCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  streakFlameWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.amber + '18',
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  streakCardTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.amber,
  },
  streakCardSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.amber,
    opacity: 0.7,
    marginTop: 2,
  },
  streakCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingLeft: SPACING.md,
  },
  streakCtaText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.amber,
    letterSpacing: TRACKING.label,
  },

  // ── Tip card
  tipCard: {
    marginBottom: LAYOUT.sectionGap,
  },
  tipBody: {},
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  tipEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
