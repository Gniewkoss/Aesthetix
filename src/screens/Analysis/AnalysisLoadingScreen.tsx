import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useProgressStore } from '../../store/useProgressStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { XP_REWARDS } from '../../constants';
import { COLORS, SPACING } from '../../theme';
import { useSmoothedProgress, useDisplayProgressPercent } from '../../hooks/useSmoothedProgress';
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
  const markFirstScanDone = useOnboardingStore((s) => s.markFirstScanDone);
  const { addEntry } = useProgressStore();
  const insets = useSafeAreaInsets();

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
    if (didStart.current) return;
    didStart.current = true;

    const task = InteractionManager.runAfterInteractions(() => {
      startAnalysis();
    });
    return () => task.cancel();
  }, []);

  const startAnalysis = async () => {
    try {
      const analysis = await runAnalysis(imageUris);

      if (!analysis) {
        const { error: storeError, isRateLimited } = useAnalysisStore.getState();
        if (isRateLimited()) {
          Alert.alert(
            'Premium required',
            storeError ?? 'Daily scan limit reached. Upgrade to Premium for unlimited scans.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
              {
                text: 'Get Premium',
                onPress: () => navigation.replace('Premium', { pendingImageUris: imageUris }),
              },
            ],
          );
          return;
        }
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
      markFirstScanDone();
      addEntry({
        date: new Date().toISOString().split('T')[0],
        overallScore: analysis.overallScore,
        bodyFat: analysis.bodyFat,
        symmetryScore: analysis.symmetryScore,
        vTaperScore: analysis.vTaperScore,
      });

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
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.content, fadeStyle, { paddingBottom: insets.bottom + SPACING.lg }]}
      >
        <AnalysisBrandHeader topInset={insets.top} />

        <View style={styles.main}>
          <AnalysisProgressRing
            imageUris={imageUris}
            progress={displayProgress}
            percentLabel={percentLabel}
          />

          <View style={styles.textArea}>
            <AnalysisStepCarousel
              backendStep={analysisStep}
              complete={phase === 'complete'}
            />
          </View>
        </View>
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
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING['2xl'],
  },
  textArea: {
    width: '100%',
    marginTop: SPACING['2xl'],
  },
});
