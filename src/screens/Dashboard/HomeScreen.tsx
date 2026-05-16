import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { GradientButton } from '../../components/ui/GradientButton';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';
import { RANK_CONFIG, MUSCLE_GROUP_META } from '../../constants';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { history, loadHistory, setCurrentAnalysis } = useAnalysisStore();

  useEffect(() => {
    if (history.length === 0) loadHistory();
  }, []);

  const latestAnalysis = history[history.length - 1] ?? null;
  const rankConfig = user ? RANK_CONFIG[user.rank] : null;

  const handleViewReport = () => {
    if (latestAnalysis) {
      setCurrentAnalysis(latestAnalysis);
      navigation.navigate('Dashboard', { analysisId: latestAnalysis.id });
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Header ─────────────────────────── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <View>
              <Text style={styles.greeting}>{user?.name ?? 'Athlete'}</Text>
              <Text style={styles.subGreeting}>Ready to optimize today?</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium')}
              style={styles.premiumBadge}
            >
              {user?.isPremium ? (
                <LinearGradient colors={['#B45309', '#D97706']} style={styles.premiumInner}>
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

          {/* ── Stats row ─────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statsCard}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color={COLORS.amber} />
              <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name={rankConfig?.icon as any ?? 'leaf-outline'} size={16} color={rankConfig?.color ?? COLORS.text.muted} />
              <Text style={[styles.statValue, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                {user?.rank ?? 'Beginner'}
              </Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flash" size={16} color={COLORS.accent} />
              <Text style={styles.statValue}>{user?.xp ?? 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </Animated.View>

          {/* ── Latest Scan ─────────────────── */}
          {latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(140).duration(400)}>
              <Text style={styles.sectionLabel}>LATEST SCAN</Text>
              <TouchableOpacity onPress={handleViewReport} activeOpacity={0.82}>
                <View style={[styles.latestCard, { borderColor: getScoreColor(latestAnalysis.overallScore) + '20' }]}>
                  <CircularProgress score={latestAnalysis.overallScore} size={110} strokeWidth={9} />
                  <View style={styles.latestInfo}>
                    <Text style={styles.latestTitle}>Physique Score</Text>
                    <Text style={styles.latestDate}>
                      {new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                      <Text style={styles.viewReport}>View report</Text>
                      <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Scan CTA ────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.scanSection}>
            <Text style={styles.sectionLabel}>AI BODY SCAN</Text>
            <View style={styles.scanCard}>
              <View style={styles.scanCardTop}>
                <View>
                  <Text style={styles.scanTitle}>Scan Your Physique</Text>
                  <Text style={styles.scanSub}>
                    {user?.isPremium
                      ? 'Unlimited scans active'
                      : `${(user?.maxScansPerDay ?? 1) - (user?.scansToday ?? 0)} scan${((user?.maxScansPerDay ?? 1) - (user?.scansToday ?? 0)) !== 1 ? 's' : ''} remaining today`}
                  </Text>
                </View>
                <View style={styles.scanIconWrap}>
                  <Ionicons name="scan-outline" size={22} color={COLORS.accent} />
                </View>
              </View>
              <GradientButton
                title="Start AI Scan"
                onPress={() => navigation.navigate('Upload')}
                size="md"
                style={{ marginTop: SPACING.base }}
              />
            </View>
          </Animated.View>

          {/* ── Priority Areas ──────────────── */}
          {latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(260).duration(400)}>
              <Text style={styles.sectionLabel}>PRIORITY AREAS</Text>
              <View style={styles.priorityGrid}>
                {latestAnalysis.priorityAreas.slice(0, 4).map((area, i) => {
                  const meta = MUSCLE_GROUP_META[area as keyof typeof MUSCLE_GROUP_META];
                  const score = latestAnalysis.muscleGroups[area as keyof typeof latestAnalysis.muscleGroups]?.score ?? 0;
                  const scoreColor = getScoreColor(score);
                  return (
                    <View key={i} style={styles.priorityCell}>
                      <View style={[styles.priorityIconWrap, { borderColor: scoreColor + '25' }]}>
                        <Ionicons name={meta?.icon as any ?? 'barbell-outline'} size={18} color={scoreColor} />
                      </View>
                      <Text style={styles.priorityName}>{meta?.label ?? area}</Text>
                      <Text style={[styles.priorityScore, { color: scoreColor }]}>{score}</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Insight Card ─────────────────── */}
          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIconWrap}>
                <Ionicons name="bulb-outline" size={14} color={COLORS.amber} />
              </View>
              <Text style={styles.insightTitle}>Training Insight</Text>
            </View>
            <Text style={styles.insightText}>
              Progressive overload drives muscle growth. Add 2.5 kg to your compound lifts every 1–2 weeks — track every set, every rep.
            </Text>
          </Animated.View>

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  greeting: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
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
    letterSpacing: 0.5,
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
    letterSpacing: 0.8,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING['2xl'],
  },
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
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 4 },

  sectionLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: 1.8,
    marginBottom: SPACING.md,
    marginTop: SPACING.base,
  },

  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING['2xl'],
  },
  latestInfo: { flex: 1 },
  latestTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
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

  scanSection: { marginBottom: SPACING['2xl'] },
  scanCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
  },
  scanCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scanTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONT_FAMILY.heading,
    color: COLORS.text.primary,
    letterSpacing: 0.3,
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
    borderRadius: 12,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING['2xl'],
  },
  priorityCell: {
    width: '47%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  priorityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
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
  },

  insightCard: {
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
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
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.amber,
  },
  insightText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.65,
  },
});
