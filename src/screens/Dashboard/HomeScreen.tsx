import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { GradientButton } from '../../components/ui/GradientButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { COLORS, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';
import { RANK_CONFIG, MUSCLE_GROUP_META } from '../../constants';
import { MOCK_HISTORY } from '../../api/mock';

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
  const xpToNext = user ? (rankConfig ? 500 - (user.xp % 500) : 0) : 0;

  const handleViewReport = () => {
    if (latestAnalysis) {
      setCurrentAnalysis(latestAnalysis);
      navigation.navigate('Dashboard', { analysisId: latestAnalysis.id });
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(123,47,190,0.15)', 'transparent']}
        style={styles.heroBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Header ─────────────────────────── */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <View>
              <Text style={styles.greeting}>GM, {user?.name ?? 'Athlete'} 👋</Text>
              <Text style={styles.subGreeting}>Ready to dominate today?</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium')}
              style={styles.premiumBadge}
            >
              {user?.isPremium ? (
                <LinearGradient colors={['#FFD600', '#FF6B00']} style={styles.premiumInner}>
                  <Text style={styles.premiumText}>PRO ⚡</Text>
                </LinearGradient>
              ) : (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>FREE</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Streak & XP ─────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <LinearGradient
              colors={['rgba(0,245,255,0.08)', 'rgba(123,47,190,0.06)']}
              style={styles.statsCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Streak */}
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Rank */}
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>{rankConfig?.icon ?? '🌱'}</Text>
                <Text style={[styles.statValue, { color: rankConfig?.color ?? COLORS.text.secondary }]}>
                  {user?.rank ?? 'Beginner'}
                </Text>
                <Text style={styles.statLabel}>Rank</Text>
              </View>

              <View style={styles.statDivider} />

              {/* XP */}
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⚡</Text>
                <Text style={styles.statValue}>{user?.xp ?? 0}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Latest Score ────────────────────── */}
          {latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <Text style={styles.sectionLabel}>LATEST SCAN</Text>
              <TouchableOpacity onPress={handleViewReport} activeOpacity={0.85}>
                <LinearGradient
                  colors={[getScoreColor(latestAnalysis.overallScore) + '15', 'rgba(0,0,0,0)']}
                  style={styles.latestCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <CircularProgress score={latestAnalysis.overallScore} size={120} strokeWidth={10} />
                  <View style={styles.latestInfo}>
                    <Text style={styles.latestTitle}>Physique Score</Text>
                    <Text style={styles.latestDate}>
                      {new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.latestTags}>
                      <View style={styles.latestTag}>
                        <Text style={styles.latestTagText}>BF: {latestAnalysis.bodyFat}%</Text>
                      </View>
                      <View style={styles.latestTag}>
                        <Text style={styles.latestTagText}>V-Taper: {latestAnalysis.vTaperScore}</Text>
                      </View>
                    </View>
                    <Text style={styles.viewReport}>View Full Report →</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Scan CTA ────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.scanCta}>
            <LinearGradient
              colors={['rgba(0,245,255,0.1)', 'rgba(123,47,190,0.08)']}
              style={styles.scanCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.scanTitle}>Scan Your Physique</Text>
              <Text style={styles.scanSub}>
                {user?.isPremium
                  ? 'Unlimited daily scans'
                  : `${user?.maxScansPerDay! - user?.scansToday!} scan${user?.maxScansPerDay! - user?.scansToday! !== 1 ? 's' : ''} remaining today`}
              </Text>
              <GradientButton
                title="Start AI Scan →"
                onPress={() => navigation.navigate('Upload')}
                size="md"
                style={{ marginTop: SPACING.base }}
              />
            </LinearGradient>
          </Animated.View>

          {/* ── Priority Areas ───────────────────── */}
          {latestAnalysis && (
            <Animated.View entering={FadeInDown.delay(250).duration(500)}>
              <Text style={styles.sectionLabel}>PRIORITY AREAS</Text>
              <View style={styles.priorityGrid}>
                {latestAnalysis.priorityAreas.slice(0, 4).map((area, i) => {
                  const meta = MUSCLE_GROUP_META[area as keyof typeof MUSCLE_GROUP_META];
                  const score = latestAnalysis.muscleGroups[area as keyof typeof latestAnalysis.muscleGroups]?.score ?? 0;
                  return (
                    <GlassCard key={i} style={styles.priorityCell} padding={12}>
                      <Text style={styles.priorityEmoji}>{meta?.emoji ?? '💪'}</Text>
                      <Text style={styles.priorityName}>{meta?.label ?? area}</Text>
                      <Text style={[styles.priorityScore, { color: getScoreColor(score) }]}>{score}</Text>
                    </GlassCard>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── AI Tips ─────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipTitle}>AI Tip of the Day</Text>
            </View>
            <Text style={styles.tipText}>
              Progressive overload is the #1 driver of muscle growth. Add 2.5kg to your compound lifts every 1-2 weeks. Track every set, every rep.
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
  heroBg: { position: 'absolute', width: '150%', height: 350, top: -50, left: -50 },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  subGreeting: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 2 },
  premiumBadge: { borderRadius: RADIUS.md, overflow: 'hidden' },
  premiumInner: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md },
  premiumText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.black, color: '#000' },
  freeBadge: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  freeText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.text.muted },
  statsCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
  sectionLabel: {
    fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.text.muted,
    letterSpacing: 2, marginBottom: SPACING.md, marginTop: SPACING.base,
  },
  latestCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    marginBottom: SPACING.xl,
  },
  latestInfo: { flex: 1 },
  latestTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text.primary },
  latestDate: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, marginTop: 2 },
  latestTags: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },
  latestTag: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  latestTagText: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontWeight: FONTS.weights.semibold },
  viewReport: { color: COLORS.cyan, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, marginTop: SPACING.sm },
  scanCta: { marginBottom: SPACING.xl },
  scanCard: {
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(0,245,255,0.15)', padding: SPACING.base,
  },
  scanTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  scanSub: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 2 },
  priorityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.xl },
  priorityCell: { width: '47%', alignItems: 'center', gap: 4 },
  priorityEmoji: { fontSize: 24 },
  priorityName: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, fontWeight: FONTS.weights.semibold },
  priorityScore: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black },
  tipCard: {
    backgroundColor: 'rgba(255,214,0,0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.2)',
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  tipIcon: { fontSize: 20 },
  tipTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.yellow },
  tipText: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, lineHeight: FONTS.sizes.sm * 1.6 },
});
