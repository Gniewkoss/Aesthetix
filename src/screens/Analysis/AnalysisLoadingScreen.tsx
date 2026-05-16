import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeIn, FadeInDown,
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { XP_REWARDS } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisLoading'>;

const METRICS = ['Symmetry', 'V-Taper', 'Body Fat', 'Muscle Groups', 'Posture'];
const RING_SIZE = 260;
const STROKE_WIDTH = 14;
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function AnalysisLoadingScreen({ navigation, route }: Props) {
  const { imageUris } = route.params;
  const { runAnalysis, analysisProgress, analysisStep } = useAnalysisStore();
  const { addXP, decrementScans, incrementStreak } = useAuthStore();
  const didStart = useRef(false);

  const progressShared = useSharedValue(0);

  useEffect(() => {
    if (!didStart.current) {
      didStart.current = true;
      startAnalysis();
    }
  }, []);

  useEffect(() => {
    progressShared.value = withTiming(analysisProgress / 100, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [analysisProgress]);

  const startAnalysis = async () => {
    try {
      const analysis = await runAnalysis(imageUris);
      if (analysis) {
        addXP(XP_REWARDS.dailyScan);
        decrementScans();
        incrementStreak();
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: 'MainTabs' },
              { name: 'Dashboard', params: { analysisId: analysis.id } },
            ],
          })
        );
      } else {
        const storeError = useAnalysisStore.getState().error;
        Alert.alert(
          'Analysis Failed',
          storeError ?? 'Could not analyze photos. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch {
      Alert.alert(
        'Analysis Failed',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressShared.value),
  }));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text entering={FadeIn.duration(400)} style={styles.headerLabel}>
          AI PHYSIQUE ANALYSIS
        </Animated.Text>

        {/* Progress ring with photos and % inside */}
        <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.ringWrapper}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#1D4ED8" stopOpacity="1" />
                <Stop offset="100%" stopColor="#6D28D9" stopOpacity="1" />
              </SvgGradient>
            </Defs>
            {/* Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Inner background */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS - STROKE_WIDTH / 2 - 1}
              fill="rgba(8,8,8,0.5)"
            />
            {/* Progress arc */}
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="url(#progressGrad)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={ringAnimatedProps}
              transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
            />
          </Svg>

          {/* Inner content: photos + percent */}
          <View style={styles.ringInner}>
            <View style={styles.photosRow}>
              {imageUris.slice(0, 3).map((uri, i) => (
                <View key={i} style={styles.photoCircle}>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                </View>
              ))}
            </View>
            <View style={styles.percentRow}>
              <Text style={styles.percentNum}>{Math.round(analysisProgress)}</Text>
              <Text style={styles.percentSign}>%</Text>
            </View>
            <Text style={styles.analyzingLabel}>ANALYZING</Text>
          </View>
        </Animated.View>

        {/* Current step */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.stepArea}>
          <Text style={styles.stepText}>{analysisStep || 'Initializing...'}</Text>
        </Animated.View>

        {/* Metrics pills */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.metricsRow}>
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

  headerLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: 2.5,
    marginBottom: SPACING['2xl'],
  },

  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING['2xl'],
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },

  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  photosRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  photoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.28)',
  },

  percentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  percentNum: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 40,
    color: COLORS.text.primary,
    lineHeight: 44,
  },
  percentSign: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONTS.sizes.lg,
    color: COLORS.accent,
    lineHeight: 28,
    paddingBottom: 4,
  },

  analyzingLabel: {
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: 9,
    color: COLORS.accent,
    letterSpacing: 2.5,
    marginTop: SPACING.xs,
  },

  stepArea: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.base,
  },
  stepText: {
    fontFamily: FONT_FAMILY.bodySemibold,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
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
