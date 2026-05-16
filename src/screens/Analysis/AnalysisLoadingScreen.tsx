import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, Easing,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import { XP_REWARDS } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisLoading'>;

export function AnalysisLoadingScreen({ navigation, route }: Props) {
  const { imageUris } = route.params;
  const { runAnalysis, analysisProgress, analysisStep } = useAnalysisStore();
  const { addXP, decrementScans, incrementStreak } = useAuthStore();

  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );

    startAnalysis();
  }, []);

  const startAnalysis = async () => {
    const analysis = await runAnalysis(imageUris);
    if (analysis) {
      addXP(XP_REWARDS.dailyScan);
      decrementScans();
      incrementStreak();
      navigation.replace('Dashboard', { analysisId: analysis.id });
    } else {
      navigation.goBack();
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(123,47,190,0.2)', 'rgba(0,245,255,0.08)', 'transparent']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <SafeAreaView style={styles.safe}>
        {/* Preview thumbnails */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.thumbsRow}>
          {imageUris.slice(0, 3).map((uri, i) => (
            <View key={i} style={[styles.thumb, { opacity: 0.5 - i * 0.1 }]}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
            </View>
          ))}
        </Animated.View>

        {/* AI brain animation */}
        <Animated.View style={[styles.brainWrapper, pulseStyle]}>
          <LinearGradient
            colors={['#7B2FBE40', '#00F5FF20']}
            style={styles.brainOuter}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={[styles.brainRing, rotateStyle]}>
              <LinearGradient
                colors={['#00F5FF', '#7B2FBE', '#00F5FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <View style={styles.brainInner}>
              <Text style={styles.brainEmoji}>🤖</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Status text */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.statusArea}>
          <Text style={styles.analyzing}>ANALYZING PHYSIQUE</Text>
          <Text style={styles.step}>{analysisStep}</Text>
        </Animated.View>

        {/* Progress bar */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${analysisProgress}%` as any },
              ]}
            >
              <LinearGradient
                colors={['#7B2FBE', '#00F5FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>{Math.round(analysisProgress)}%</Text>
        </Animated.View>

        {/* AI metrics being analyzed */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.metricsRow}>
          {['Symmetry', 'V-Taper', 'Body Fat', 'Muscle Groups', 'Posture'].map((m) => (
            <View key={m} style={styles.metricPill}>
              <Text style={styles.metricText}>{m}</Text>
            </View>
          ))}
        </Animated.View>

        <Text style={styles.disclaimer}>
          Powered by GPT-4o Vision • Results are estimations for fitness guidance only
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  thumbsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING['3xl'],
    height: 80,
  },
  thumb: {
    width: 60,
    height: 80,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.glass.bg,
  },
  brainWrapper: {
    marginBottom: SPACING['3xl'],
  },
  brainOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)',
  },
  brainRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    opacity: 0.3,
  },
  brainInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
  },
  brainEmoji: { fontSize: 52 },
  statusArea: { alignItems: 'center', marginBottom: SPACING.xl },
  analyzing: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.cyan,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  step: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  progressArea: {
    width: '100%',
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressText: {
    color: COLORS.cyan,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING['2xl'],
  },
  metricPill: {
    backgroundColor: 'rgba(0,245,255,0.08)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)',
  },
  metricText: { color: COLORS.cyan, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold },
  disclaimer: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    lineHeight: FONTS.sizes.xs * 1.6,
    position: 'absolute',
    bottom: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
  },
});
