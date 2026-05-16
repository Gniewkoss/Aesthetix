import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { history, loadHistory, setCurrentAnalysis } = useAnalysisStore();

  useEffect(() => {
    if (history.length === 0) loadHistory();
  }, []);

  if (history.length === 0) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl }]}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="scan-outline" size={32} color={COLORS.text.disabled} />
        </View>
        <Text style={styles.emptyTitle}>No scans yet</Text>
        <Text style={styles.emptyText}>Your scan history will appear here</Text>
        <GradientButton title="Do Your First Scan" onPress={() => navigation.navigate('Upload')} style={{ marginTop: SPACING.xl }} />
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
        <View style={styles.header}>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>{history.length} scans total</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Progress summary */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryLabel}>Total Progress</Text>
              <Text style={[styles.summaryDelta, { color: improvement >= 0 ? COLORS.green : COLORS.red }]}>
                {improvement >= 0 ? '+' : ''}{improvement} pts
              </Text>
              <Text style={styles.summaryRange}>{first.overallScore} → {latest.overallScore}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Ionicons
                name={improvement >= 0 ? 'trending-up' : 'trending-down'}
                size={28}
                color={improvement >= 0 ? COLORS.green : COLORS.red}
              />
            </View>
          </Animated.View>

          {/* History list */}
          {sorted.map((analysis, i) => {
            const color = getScoreColor(analysis.overallScore);
            const date = new Date(analysis.createdAt);

            return (
              <Animated.View key={analysis.id} entering={FadeInDown.delay(i * 60).duration(350)}>
                <TouchableOpacity
                  onPress={() => {
                    setCurrentAnalysis(analysis);
                    navigation.navigate('Dashboard', { analysisId: analysis.id });
                  }}
                  activeOpacity={0.82}
                >
                  <View style={styles.historyCard}>
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

                    <View style={{ alignItems: 'flex-end' }}>
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
                      <Ionicons name="chevron-forward" size={14} color={COLORS.text.disabled} style={{ marginTop: 4 }} />
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
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING['2xl'], marginBottom: SPACING.base },
  title: { fontSize: FONTS.sizes['2xl'], fontFamily: FONT_FAMILY.display, color: COLORS.text.primary, letterSpacing: 0.5 },
  subtitle: { fontSize: FONTS.sizes.sm, fontFamily: FONT_FAMILY.body, color: COLORS.text.muted, marginTop: 2 },
  scroll: { paddingHorizontal: SPACING.base },

  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.heading,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

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
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    letterSpacing: 0.5,
  },
  summaryDelta: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
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
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  historyInfo: { flex: 1 },
  historyDate: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  historyTime: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  historyTags: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },
  historyTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  historyTagText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
  },
  historyScore: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
  },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  historyScanDelta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
  },
});
