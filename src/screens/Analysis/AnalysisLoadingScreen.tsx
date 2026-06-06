import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert, InteractionManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { navigateToUpgrade } from '../../navigation/navigateToUpgrade';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { XP_REWARDS } from '../../constants';
import { isSupabaseConfigured } from '../../api/supabase';
import { C, S, LAYOUT } from '../../theme/obsidian';
import { AnalysisHeaderGlow } from '../../components/analysis/loading/AnalysisHeaderGlow';
import { AnalysisCenterGlow } from '../../components/analysis/loading/AnalysisCenterGlow';
import { AnalysisBrandHeader } from '../../components/analysis/loading/AnalysisBrandHeader';
import { AnalysisParticles } from '../../components/analysis/loading/AnalysisParticles';
import { PhysiqueCircularLoader } from '../../components/analysis/loading/PhysiqueCircularLoader';
import { PhysiqueLoadingStatus } from '../../components/analysis/loading/PhysiqueLoadingStatus';
import { useSmoothedProgress, useDisplayProgressPercent } from '../../hooks/useSmoothedProgress';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import {
  MIN_LOADING_MS,
  COMPLETION_HOLD_MS,
} from '../../components/analysis/loading/constants';
import { syncPushNotificationSchedule } from '../../lib/pushNotifications';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisLoading'>;

type Phase = 'analyzing' | 'complete' | 'exiting';

export function AnalysisLoadingScreen({ navigation, route }: Props) {
  const { imageUris } = route.params;
  const { runAnalysis, analysisProgress, analysisStep } = useAnalysisStore();
  const { addXP, decrementScans, incrementStreak, syncFromSession, markFreeScanUsed } = useAuthStore();
  const markFirstScanDone = useOnboardingStore((s) => s.markFirstScanDone);
  const { addEntry } = useProgressStore();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

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
        const { error: storeError, requiresPremiumUpgrade, errorCode } = useAnalysisStore.getState();
        if (requiresPremiumUpgrade()) {
          const isPremium = useAuthStore.getState().user?.isPremium;
          if (isPremium) {
            Alert.alert(
              'Scan blocked',
              'Premium is active on this device but the server has not synced yet. Go back and try again in a moment.',
              [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
          } else {
            navigation.replace('UpgradePaywall', {
              reason: errorCode === 'DEVICE_LIMITED' ? 'scan_limit' : 'scan_limit',
              pendingImageUris: imageUris,
            });
          }
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

      if (isSupabaseConfigured) {
        await syncFromSession();
      } else {
        addXP(XP_REWARDS.dailyScan);
        decrementScans();
        incrementStreak();
      }
      if (useAuthStore.getState().user?.subscriptionTier === 'free') {
        await markFreeScanUsed();
      }
      markFirstScanDone();
      addEntry({
        date: new Date().toISOString().split('T')[0],
        overallScore: analysis.overallScore,
        bodyFat: analysis.bodyFat,
        symmetryScore: analysis.symmetryScore,
        vTaperScore: analysis.vTaperScore,
      });

      void syncPushNotificationSchedule();

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

  const complete = phase !== 'analyzing';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[C.surface1, C.canvas, C.canvas]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AnalysisHeaderGlow />
      <AnalysisCenterGlow />
      <AnalysisParticles animate={!reduceMotion} />

      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.content, fadeStyle, { paddingBottom: insets.bottom + S.xl }]}
      >
        <View style={styles.header}>
          <AnalysisBrandHeader topInset={insets.top} />
        </View>

        <View style={styles.loaderArea}>
          <PhysiqueCircularLoader
            imageUris={imageUris}
            progress={displayProgress}
            percentLabel={percentLabel}
            reduceMotion={reduceMotion}
          />
        </View>

        <View style={styles.statusArea}>
          <PhysiqueLoadingStatus
            backendStep={analysisStep}
            complete={complete}
            reduceMotion={reduceMotion}
          />
        </View>
      </Animated.View>

      <LinearGradient
        colors={['transparent', C.canvas]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </View>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenX,
    zIndex: 1,
  },
  header: {
    flexShrink: 0,
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  statusArea: {
    flexShrink: 0,
    paddingBottom: S['2xl'],
    paddingTop: S.md,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    zIndex: 2,
  },
});
