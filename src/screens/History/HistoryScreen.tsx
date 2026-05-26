import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionLabel } from '../../components/common/SectionLabel';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING, getScoreColor } from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { history, setCurrentAnalysis } = useAnalysisStore();

  const sorted = useMemo(
    () => [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [history],
  );

  if (history.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageHeader variant="tab" title="History" subtitle="No scans yet" />
          <EmptyState
            iconName="scan-outline"
            iconColor={COLORS.accent}
            title="No scans yet"
            subtitle={`Your scan history appears here.\nRun your first AI physique analysis to get started.`}
          >
            <Button
              variant="default"
              size="lg"
              onPress={() => navigation.navigate('Upload')}
              trailingIcon={<Ionicons name="arrow-forward" size={14} color={COLORS.text.onAccent} />}
            >
              Start First Scan
            </Button>
            <Text style={styles.emptyHint}>Free · Takes under 60 seconds</Text>
          </EmptyState>
        </SafeAreaView>
      </View>
    );
  }

  const first = sorted[sorted.length - 1];
  const latest = sorted[0];
  const improvement = latest.overallScore - first.overallScore;
  const isPositive = improvement >= 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageHeader
          variant="tab"
          title="History"
          subtitle={`${history.length} scan${history.length !== 1 ? 's' : ''}`}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Progress summary ─────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryBody}>
                <View style={styles.summaryLeft}>
                  <Text style={styles.summaryEyebrow}>TOTAL PROGRESS</Text>
                  <Text style={[styles.summaryDelta, { color: isPositive ? COLORS.green : COLORS.red }]}>
                    {isPositive ? '+' : ''}{improvement} pts
                  </Text>
                  <Text style={styles.summaryRange}>
                    {first.overallScore} → {latest.overallScore}
                  </Text>
                </View>
                <View style={[
                  styles.summaryIconBox,
                  { backgroundColor: isPositive ? COLORS.greenDim : COLORS.redDim },
                ]}>
                  <Ionicons
                    name={isPositive ? 'trending-up' : 'trending-down'}
                    size={22}
                    color={isPositive ? COLORS.green : COLORS.red}
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <SectionLabel label="All Scans" />

          {/* ── History list — grouped iOS style ─────────── */}
          <Animated.View entering={FadeInDown.delay(60).duration(350)}>
            <GlassCard padding={0}>
          {sorted.map((analysis, i) => {
            const color = getScoreColor(analysis.overallScore);
            const date = new Date(analysis.createdAt);
            const prevScore = sorted[i + 1]?.overallScore;
            const diff = prevScore !== undefined ? analysis.overallScore - prevScore : null;

            return (
                <TouchableOpacity
                  key={analysis.id}
                  onPress={() => {
                    setCurrentAnalysis(analysis);
                    navigation.navigate('Dashboard', { analysisId: analysis.id });
                  }}
                  activeOpacity={0.76}
                  accessibilityRole="button"
                  accessibilityLabel={`Scan from ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, score ${analysis.overallScore}`}
                  style={[styles.historyRow, i < sorted.length - 1 && styles.historyRowBorder]}
                >
                    <View style={styles.historyBody}>
                      <CircularProgress
                        score={analysis.overallScore}
                        size={60}
                        strokeWidth={5}
                        showLabel={false}
                        animated={false}
                      />

                      <View style={styles.historyInfo}>
                        <Text style={styles.historyDate}>
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={styles.historyTime}>
                          {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <View style={styles.historyTags}>
                          <Badge variant="secondary" size="sm">BF {analysis.bodyFat}%</Badge>
                          <Badge variant="secondary" size="sm">Sym {analysis.symmetryScore}</Badge>
                        </View>
                      </View>

                      <View style={styles.historyRight}>
                        <Text style={[styles.historyScore, { color }]}>{analysis.overallScore}</Text>
                        {diff !== null && diff !== 0 && (
                          <View style={styles.deltaRow}>
                            <Ionicons
                              name={diff > 0 ? 'arrow-up' : 'arrow-down'}
                              size={10}
                              color={diff > 0 ? COLORS.green : COLORS.red}
                            />
                            <Text style={[styles.deltaText, { color: diff > 0 ? COLORS.green : COLORS.red }]}>
                              {Math.abs(diff)}
                            </Text>
                          </View>
                        )}
                        <Ionicons name="chevron-forward" size={14} color={COLORS.text.disabled} />
                      </View>
                    </View>
                </TouchableOpacity>
            );
          })}
            </GlassCard>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: {
    paddingHorizontal: LAYOUT.pagePad,
    paddingBottom: LAYOUT.tabScrollBottom,
  },

  emptyHint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.label,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  summaryCard: {
    marginBottom: SPACING.lg,
  },
  summaryBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  summaryLeft: { gap: 3 },
  summaryEyebrow: {
    fontSize: FONTS.sizes.xs,
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
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.hairline,
  },
  historyBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.base,
  },
  historyInfo: { flex: 1, minWidth: 0, gap: 3 },
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
  historyRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
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
  deltaText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
  },
});
