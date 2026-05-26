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
import { REDESIGN } from '../../theme/redesign-new';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { COLORS, FONTS, SPACING, RADIUS, SHADOWS, LAYOUT, GRADIENTS } = REDESIGN;

/**
 * REDESIGNED HOME SCREEN — VIBRANT & BLOCK-BASED
 *
 * Design: Bold orange + green, large gaps (48px), athletic typography
 * Layout: Bento box style with modular cards
 * Vibe: Energetic, data-focused, fitness-oriented
 */

export function HomeScreenRedesign() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { history, setCurrentAnalysis } = useAnalysisStore();

  const latestAnalysis = history[0] ?? null;
  const hasScan = history.length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ══════════════════════════════════════════════════════════════
              HEADER: BOLD GREETING + STATUS
          ══════════════════════════════════════════════════════════════ */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.headerSection}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>
                  {user?.name?.split(' ')[0] ?? 'Athlete'}
                </Text>
                <Text style={styles.subGreeting}>
                  {hasScan ? 'Ready for your next scan' : 'Start your first analysis'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: hasScan ? COLORS.success : COLORS.primary }]}>
                <Text style={styles.statusBadgeText}>
                  {hasScan ? 'ACTIVE' : 'NEW'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ══════════════════════════════════════════════════════════════
              HERO CARD: LATEST SCORE OR CALL TO ACTION
          ══════════════════════════════════════════════════════════════ */}
          {hasScan && latestAnalysis && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.heroCard}
            >
              <LinearGradient
                colors={GRADIENTS.heroOrange}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>YOUR LATEST SCORE</Text>
                <Text style={styles.heroNumber}>{latestAnalysis.overallScore}</Text>
                <Text style={styles.heroMeta}>
                  {new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => {
                  setCurrentAnalysis(latestAnalysis);
                  navigation.navigate('Dashboard', { analysisId: latestAnalysis.id });
                }}
              >
                <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ACTION GRID: 2-COLUMN BENTO STYLE
          ══════════════════════════════════════════════════════════════ */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={styles.actionGrid}
          >
            {/* SCAN CARD */}
            <TouchableOpacity
              style={[styles.gridCard, styles.gridCardLarge]}
              onPress={() => navigation.navigate('Upload')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={GRADIENTS.heroGreen}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gridCardContent}>
                <View style={styles.gridCardIcon}>
                  <Ionicons name="camera" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.gridCardTitle}>New Scan</Text>
                <Text style={styles.gridCardSubtitle}>Analyze physique</Text>
              </View>
            </TouchableOpacity>

            {/* HISTORY CARD */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}
              activeOpacity={0.8}
            >
              <View style={[styles.gridCardBg, { borderColor: COLORS.primary }]} />
              <View style={styles.gridCardContent}>
                <Ionicons name="time" size={24} color={COLORS.primary} />
                <Text style={styles.gridCardTitle}>History</Text>
              </View>
            </TouchableOpacity>

            {/* PROGRESS CARD */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Progress' })}
              activeOpacity={0.8}
            >
              <View style={[styles.gridCardBg, { borderColor: COLORS.success }]} />
              <View style={styles.gridCardContent}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
                <Text style={styles.gridCardTitle}>Progress</Text>
              </View>
            </TouchableOpacity>

            {/* PREMIUM CARD */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('Premium')}
              activeOpacity={0.8}
            >
              <View style={[styles.gridCardBg, { borderColor: COLORS.primary }]} />
              <View style={styles.gridCardContent}>
                <Ionicons name="flash" size={24} color={COLORS.primary} />
                <Text style={styles.gridCardTitle}>Pro</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ══════════════════════════════════════════════════════════════
              STATS: 3-COLUMN CARD ROW
          ══════════════════════════════════════════════════════════════ */}
          {user && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.statsSection}
            >
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{history.length}</Text>
                  <Text style={styles.statLabel}>Scans</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{user.level}</Text>
                  <Text style={styles.statLabel}>Level</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{user.streak ?? 0}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════════════════════════
              BOTTOM SPACING
          ══════════════════════════════════════════════════════════════ */}
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
    gap: SPACING['3xl'],  // 48px gaps between sections
  },

  // ─── HEADER ────────────────────────────────────────────────────────────────
  headerSection: {
    marginTop: SPACING.md,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  greeting: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },

  subGreeting: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
  },

  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },

  statusBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.family.heading,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── HERO CARD ──────────────────────────────────────────────────────────────
  heroCard: {
    ...SHADOWS.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    minHeight: 140,
  },

  heroContent: {
    flex: 1,
  },

  heroLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.heading,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  heroNumber: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONTS.family.display,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: FONTS.sizes['4xl'],
  },

  heroMeta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.sm,
  },

  heroButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── ACTION GRID (BENTO BOX) ────────────────────────────────────────────────
  actionGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },

  gridCard: {
    flex: 1,
    minWidth: '45%',
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },

  gridCardLarge: {
    minWidth: '100%',
  },

  gridCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg.card,
    borderWidth: 2,
  },

  gridCardContent: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'flex-end',
  },

  gridCardIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },

  gridCardTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '700',
  },

  gridCardSubtitle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    marginTop: SPACING.xs,
  },

  // ─── STATS SECTION ──────────────────────────────────────────────────────────
  statsSection: {
    marginTop: SPACING.lg,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    ...SHADOWS.sm,
  },

  statNumber: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONTS.family.heading,
    color: COLORS.primary,
    fontWeight: '700',
  },

  statLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    marginTop: SPACING.sm,
  },
});
