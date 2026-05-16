import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useAuthStore } from '../../store/useAuthStore';
import { XP_REWARDS } from '../../constants';
import { SPACING } from '../../theme';
import { useSmoothedProgress, useDisplayProgressPercent } from '../../hooks/useSmoothedProgress';
import { AnalysisLoadingBackground } from '../../components/analysis/loading/AnalysisLoadingBackground';
import { AnalysisBrandHeader } from '../../components/analysis/loading/AnalysisBrandHeader';
import { AnalysisProgressRing } from '../../components/analysis/loading/AnalysisProgressRing';
import { AnalysisStepCarousel } from '../../components/analysis/loading/AnalysisStepCarousel';
import {
  MIN_LOADING_MS,
  COMPLETION_HOLD_MS,
} from '../../components/analysis/loading/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisLoading'>;

type Phase = 'analyzing' | 'complete' | 'exiting';

export function AnalysisLoadingScreen({ navigation, route }: Props) {
  const { imageUris } = route.params;
  const { runAnalysis, analysisProgress, analysisStep } = useAnalysisStore();
  const { addXP, decrementScans, incrementStreak } = useAuthStore();

  const didStart = useRef(false);
  const mountedAt = useRef(Date.now());
  const [phase, setPhase] = useState<Phase>('analyzing');
  const screenOpacity = useSharedValue(1);

  const displayProgress = useSmoothedProgress({
    target: analysisProgress,
    complete: phase !== 'analyzing',
  });
  const percentLabel = useDisplayProgressPercent(displayProgress);

  useEffect(() => {
    if (!didStart.current) {
      didStart.current = true;
      startAnalysis();
    }
  }, []);

  const startAnalysis = async () => {
    try {
      const analysis = await runAnalysis(imageUris);

      if (!analysis) {
        const storeError = useAnalysisStore.getState().error;
        Alert.alert(
          'Analysis Failed',
          storeError ?? 'Could not analyze photos. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      const elapsed = Date.now() - mountedAt.current;
      const waitMs = Math.max(0, MIN_LOADING_MS - elapsed);
      if (waitMs > 0) {
        await delay(waitMs);
      }

      setPhase('complete');
      await delay(COMPLETION_HOLD_MS);

      setPhase('exiting');
      screenOpacity.value = withTiming(0, { duration: 380 });
      await delay(400);

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
        }),
      );
    } catch {
      Alert.alert(
        'Analysis Failed',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  };

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <AnalysisLoadingBackground />

      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.content, fadeStyle]}
      >
        <SafeAreaView style={styles.safe}>
          <AnalysisBrandHeader />

          <View style={styles.centerBlock}>
            <Animated.View entering={FadeIn.delay(120).duration(550)} style={styles.ringArea}>
              <AnalysisProgressRing
                imageUris={imageUris}
                progress={displayProgress}
                percentLabel={percentLabel}
              />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(280).duration(450)} style={styles.textArea}>
              <AnalysisStepCarousel
                backendStep={analysisStep}
                complete={phase === 'complete'}
              />
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030308',
  },
  content: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  centerBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -SPACING['3xl'],
  },
  ringArea: {
    marginBottom: SPACING['2xl'],
  },
  textArea: {
    width: '100%',
  },
});
