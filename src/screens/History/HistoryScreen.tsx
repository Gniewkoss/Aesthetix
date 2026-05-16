import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONTS, RADIUS, SPACING, getScoreColor } from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { history, loadHistory, setCurrentAnalysis } = useAnalysisStore();

  useEffect(() => {
    if (history.length === 0) loadHistory();
  }, []);

  if (history.length === 0) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.xl }}>📊</Text>
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
          <Text style={styles.subtitle}>{history.length} total scans</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Progress summary */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <LinearGradient
              colors={improvement >= 0 ? ['rgba(6,255,165,0.1)', 'rgba(0,245,255,0.05)'] : ['rgba(255,0,110,0.1)', 'rgba(255,107,0,0.05)']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.summaryLabel}>Total Progress</Text>
              <Text style={[styles.summaryDelta, { color: improvement >= 0 ? COLORS.green : COLORS.pink }]}>
                {improvement >= 0 ? '+' : ''}{improvement} points
              </Text>
              <Text style={styles.summaryRange}>
                {first.overallScore} → {latest.overallScore}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* History list */}
          {sorted.map((analysis, i) => {
            const color = getScoreColor(analysis.overallScore);
            const date = new Date(analysis.createdAt);

            return (
              <Animated.View key={analysis.id} entering={FadeInDown.delay(i * 100).duration(400)}>
                <TouchableOpacity
                  onPress={() => {
                    setCurrentAnalysis(analysis);
                    navigation.navigate('Dashboard', { analysisId: analysis.id });
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[color + '0C', 'rgba(0,0,0,0)']}
                    style={[styles.historyCard, { borderColor: color + '25' }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <CircularProgress score={analysis.overallScore} size={72} strokeWidth={7} showLabel={false} animated={false} />

                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDate}>
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.historyTime}>
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <View style={styles.historyTags}>
                        <Text style={[styles.historyTag, { color: COLORS.cyan }]}>BF {analysis.bodyFat}%</Text>
                        <Text style={[styles.historyTag, { color: COLORS.purple }]}>Sym {analysis.symmetryScore}</Text>
                        <Text style={[styles.historyTag, { color: COLORS.green }]}>VT {analysis.vTaperScore}</Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.historyScore, { color }]}>{analysis.overallScore}</Text>
                      {i > 0 && (
                        <Text style={[
                          styles.historyScanDelta,
                          { color: analysis.overallScore >= sorted[i - 1]?.overallScore ? COLORS.green : COLORS.pink }
                        ]}>
                          {analysis.overallScore >= sorted[i - 1]?.overallScore ? '▲' : '▼'}
                          {Math.abs(analysis.overallScore - (sorted[i - 1]?.overallScore ?? analysis.overallScore))}
                        </Text>
                      )}
                    </View>
                  </LinearGradient>
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
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 2 },
  scroll: { paddingHorizontal: SPACING.base },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.text.primary, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted },
  summaryCard: {
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(6,255,165,0.2)',
    padding: SPACING.base, alignItems: 'center', marginBottom: SPACING.xl,
  },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, fontWeight: FONTS.weights.bold, letterSpacing: 1 },
  summaryDelta: { fontSize: FONTS.sizes['3xl'], fontWeight: FONTS.weights.black, marginTop: 4 },
  summaryRange: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, marginTop: 4 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text.primary },
  historyTime: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, marginTop: 2 },
  historyTags: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  historyTag: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  historyScore: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black },
  historyScanDelta: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, marginTop: 2 },
});
