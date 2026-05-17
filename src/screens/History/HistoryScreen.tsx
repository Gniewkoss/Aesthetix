import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING, getScoreColor } from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Premium empty state ──────────────────────────────────────────────────────

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <View style={emptyStyles.root}>
      <Animated.View entering={FadeIn.delay(100).duration(600)} style={emptyStyles.glowWrap}>
        <LinearGradient
          colors={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.04)', 'transparent']}
          style={emptyStyles.glow}
        />
        <View style={emptyStyles.iconRing}>
          <View style={emptyStyles.iconInner}>
            <Ionicons name="scan-outline" size={28} color={COLORS.accent} />
          </View>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(280).duration(500)} style={emptyStyles.headline}>
        No scans yet
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(380).duration(500)} style={emptyStyles.sub}>
        Your scan history appears here.{'\n'}Run your first AI physique analysis to get started.
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(520).duration(500)} style={emptyStyles.cta}>
        <GradientButton
          title="Start First Scan"
          onPress={onScan}
          icon={<Ionicons name="arrow-forward" size={14} color="#fff" />}
        />
        <Text style={emptyStyles.hint}>Free · Takes under 60 seconds</Text>
      </Animated.View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['5xl'],
  },
  glowWrap: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -30,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    backgroundColor: 'rgba(59,130,246,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sub: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: FONTS.sizes.sm * 1.65,
    marginBottom: SPACING['2xl'],
  },
  cta: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  hint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.label,
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { history, setCurrentAnalysis } = useAnalysisStore();

  if (history.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }}>
          <EmptyState onScan={() => navigation.navigate('Upload')} />
        </SafeAreaView>
      </View>
    );
  }

  const sorted = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const first = sorted[sorted.length - 1];
  const latest = sorted[0];
  const improvement = latest.overallScore - first.overallScore;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View entering={FadeIn.duration(350)} style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{history.length} scan{history.length !== 1 ? 's' : ''}</Text>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Progress summary */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryLabel}>TOTAL PROGRESS</Text>
              <Text style={[styles.summaryDelta, { color: improvement >= 0 ? COLORS.green : COLORS.red }]}>
                {improvement >= 0 ? '+' : ''}{improvement} pts
              </Text>
              <Text style={styles.summaryRange}>
                {first.overallScore} → {latest.overallScore}
              </Text>
            </View>
            <View style={[
              styles.summaryRight,
              { backgroundColor: (improvement >= 0 ? COLORS.greenDim : COLORS.redDim) },
            ]}>
              <Ionicons
                name={improvement >= 0 ? 'trending-up' : 'trending-down'}
                size={26}
                color={improvement >= 0 ? COLORS.green : COLORS.red}
              />
            </View>
          </Animated.View>

          {/* History list */}
          {sorted.map((analysis, i) => {
            const color = getScoreColor(analysis.overallScore);
            const date = new Date(analysis.createdAt);

            return (
              <Animated.View key={analysis.id} entering={FadeInDown.delay(i * 55).duration(320)}>
                <TouchableOpacity
                  onPress={() => {
                    setCurrentAnalysis(analysis);
                    navigation.navigate('Dashboard', { analysisId: analysis.id });
                  }}
                  activeOpacity={0.78}
                >
                  <View style={[styles.historyCard, { borderLeftColor: color, borderLeftWidth: 2 }]}>
                    <CircularProgress score={analysis.overallScore} size={66} strokeWidth={6} showLabel={false} animated={false} />

                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDate}>
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.historyTime}>
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <View style={styles.historyTags}>
                        <View style={styles.historyTag}>
                          <Text style={styles.historyTagText}>BF {analysis.bodyFat}%</Text>
                        </View>
                        <View style={styles.historyTag}>
                          <Text style={styles.historyTagText}>Sym {analysis.symmetryScore}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[styles.historyScore, { color }]}>{analysis.overallScore}</Text>
                      {i > 0 && (() => {
                        const diff = analysis.overallScore - (sorted[i - 1]?.overallScore ?? analysis.overallScore);
                        return diff !== 0 ? (
                          <View style={styles.deltaRow}>
                            <Ionicons
                              name={diff > 0 ? 'arrow-up' : 'arrow-down'}
                              size={10}
                              color={diff > 0 ? COLORS.green : COLORS.red}
                            />
                            <Text style={[styles.historyScanDelta, { color: diff > 0 ? COLORS.green : COLORS.red }]}>
                              {Math.abs(diff)}
                            </Text>
                          </View>
                        ) : null;
                      })()}
                      <Ionicons name="chevron-forward" size={14} color={COLORS.text.disabled} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING.base,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  scroll: { paddingHorizontal: SPACING.base },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  summaryLeft: { gap: 3 },
  summaryRight: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.caps,
  },
  summaryDelta: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },
  summaryRange: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  historyInfo: { flex: 1, gap: 3 },
  historyDate: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  historyTime: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  historyTags: { flexDirection: 'row', gap: 5, marginTop: 3 },
  historyTag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  historyTagText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
  },
  historyScore: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  historyScanDelta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
  },
});
