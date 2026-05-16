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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { XP_REWARDS } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisLoading'>;

const METRICS = ['Symmetry', 'V-Taper', 'Body Fat', 'Muscle Groups', 'Posture'];

export function AnalysisLoadingScreen({ navigation, route }: Props) {
  const { imageUris } = route.params;
  const { runAnalysis, analysisProgress, analysisStep } = useAnalysisStore();
  const { addXP, decrementScans, incrementStreak } = useAuthStore();

  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 2800, easing: Easing.linear }),
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
      <SafeAreaView style={styles.safe}>

        {/* Photo thumbnails */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.thumbsRow}>
          {imageUris.slice(0, 3).map((uri, i) => (
            <View key={i} style={[styles.thumb, { opacity: 0.55 - i * 0.12 }]}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
            </View>
          ))}
        </Animated.View>

        {/* Animated ring + icon */}
        <Animated.View style={[styles.brainWrapper, pulseStyle]}>
          <View style={styles.brainOuter}>
            <Animated.View style={[styles.brainRing, rotateStyle]}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.purple, COLORS.accent]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <View style={styles.brainInner}>
              <Ionicons name="scan" size={42} color={COLORS.accent} />
            </View>
          </View>
        </Animated.View>

        {/* Status text */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.statusArea}>
          <Text style={styles.analyzing}>ANALYZING PHYSIQUE</Text>
          <Text style={styles.step}>{analysisStep}</Text>
        </Animated.View>

        {/* Progress bar */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: `${analysisProgress}%` as any }]}
            >
              <LinearGradient
                colors={['#1D4ED8', '#3B82F6']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>{Math.round(analysisProgress)}%</Text>
        </Animated.View>

        {/* Metrics row */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.metricsRow}>
          {METRICS.map((m) => (
            <View key={m} style={styles.metricPill}>
              <Text style={styles.metricText}>{m}</Text>
            </View>
          ))}
        </Animated.View>

        <Text style={styles.disclaimer}>
          Powered by GPT-4o Vision · Results are estimations for fitness guidance only
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
    height: 72,
  },
  thumb: {
    width: 54,
    height: 72,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.glass.bg,
  },

  brainWrapper: { marginBottom: SPACING['3xl'] },
  brainOuter: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    overflow: 'hidden',
    opacity: 0.2,
  },
  brainInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(8,8,8,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },

  statusArea: { alignItems: 'center', marginBottom: SPACING.xl },
  analyzing: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 2.5,
    marginBottom: SPACING.sm,
  },
  step: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONT_FAMILY.bodySemibold,
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
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    color: COLORS.accent,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyBold,
  },

  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
    marginBottom: SPACING['2xl'],
  },
  metricPill: {
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  metricText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
  },

  disclaimer: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
    lineHeight: FONTS.sizes.xs * 1.65,
    position: 'absolute',
    bottom: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
  },
});
