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
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { REDESIGN } from '../../theme/redesign-new';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { COLORS, FONTS, SPACING, RADIUS, SHADOWS, LAYOUT } = REDESIGN;

export function HistoryScreenRedesign() {
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
            iconColor={COLORS.primary}
            title="No scans yet"
            subtitle={`Your scan history appears here.\nRun your first AI physique analysis to get started.`}
          >
            <Button
              variant="default"
              size="lg"
              onPress={() => navigation.navigate('Upload')}
              trailingIcon={<Ionicons name="arrow-forward" size={14} color="#FFFFFF" />}
            >
              Start First Scan
            </Button>
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
          {/* Summary Card */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.summaryCard}>
            <View style={styles.summaryBody}>
              <View>
                <Text style={styles.summaryLabel}>Total Progress</Text>
                <Text style={[styles.summaryValue, { color: isPositive ? COLORS.success : COLORS.status.poor }]}>
                  {isPositive ? '+' : ''}{improvement} pts
                </Text>
                <Text style={styles.summaryRange}>
                  {first.overallScore} → {latest.overallScore}
                </Text>
              </View>
              <View style={[
                styles.summaryIcon,
                { backgroundColor: isPositive ? COLORS.success + '20' : COLORS.status.poor + '20' },
              ]}>
                <Ionicons
                  name={isPositive ? 'trending-up' : 'trending-down'}
                  size={28}
                  color={isPositive ? COLORS.success : COLORS.status.poor}
                />
              </View>
            </View>
          </Animated.View>

          {/* History List */}
          <Animated.View entering={FadeInDown.delay(60).duration(350)}>
            {sorted.map((analysis, i) => {
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
                  activeOpacity={0.8}
                  style={[styles.historyCard, i > 0 && { marginTop: SPACING.md }]}
                >
                  <View style={styles.historyContent}>
                    <CircularProgress
                      score={analysis.overallScore}
                      size={56}
                      strokeWidth={4}
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
                      <Text style={styles.historyMeta}>
                        BF {analysis.bodyFat}% · Sym {analysis.symmetryScore}%
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyScore}>{analysis.overallScore}</Text>
                      {diff !== null && diff !== 0 && (
                        <View style={[styles.diffBadge, { backgroundColor: diff > 0 ? COLORS.success + '20' : COLORS.status.poor + '20' }]}>
                          <Ionicons
                            name={diff > 0 ? 'arrow-up' : 'arrow-down'}
                            size={12}
                            color={diff > 0 ? COLORS.success : COLORS.status.poor}
                          />
                          <Text style={[styles.diffText, { color: diff > 0 ? COLORS.success : COLORS.status.poor }]}>
                            {Math.abs(diff)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },

  scroll: {
    padding: LAYOUT.screenPad,
    gap: SPACING.lg,
  },

  summaryCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },

  summaryBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs,
  },

  summaryValue: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONTS.family.heading,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },

  summaryRange: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
  },

  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },

  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },

  historyInfo: {
    flex: 1,
    gap: SPACING.xs,
  },

  historyDate: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  historyTime: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
  },

  historyMeta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
  },

  historyRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },

  historyScore: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.family.heading,
    color: COLORS.primary,
    fontWeight: '700',
  },

  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },

  diffText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.heading,
    fontWeight: '600',
  },
});
