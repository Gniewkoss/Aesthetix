import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { C, T, S } from '../../../theme/obsidian';
import {
  ANALYSIS_HEADLINE,
  ANALYSIS_SUBTEXTS,
  SUBTEXT_ROTATE_MS,
  resolveStepLabel,
} from './constants';

interface PhysiqueLoadingStatusProps {
  backendStep: string;
  complete: boolean;
  reduceMotion?: boolean;
}

function LoadingDots({ animate }: { animate: boolean }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <LoadingDot key={i} index={i} animate={animate} />
      ))}
    </View>
  );
}

function LoadingDot({ index, animate }: { index: number; animate: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!animate) {
      scale.value = 1;
      return;
    }
    scale.value = withDelay(
      index * 180,
      withRepeat(
        withTiming(1.35, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [animate, index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.45 + (scale.value - 1) * 1.1,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function PhysiqueLoadingStatus({
  backendStep,
  complete,
  reduceMotion = false,
}: PhysiqueLoadingStatusProps) {
  const [rotateIndex, setRotateIndex] = React.useState(0);

  useEffect(() => {
    if (complete) return;
    const id = setInterval(
      () => setRotateIndex((i) => (i + 1) % ANALYSIS_SUBTEXTS.length),
      SUBTEXT_ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [complete]);

  const subtext = complete
    ? 'Preparing your results'
    : resolveStepLabel(backendStep, rotateIndex);
  const headline = complete ? 'Analysis complete' : ANALYSIS_HEADLINE;

  return (
    <View style={styles.wrap}>
      <Text style={styles.headline}>{headline}</Text>

      <View style={styles.subtextSlot}>
        <Animated.Text
          key={subtext}
          entering={reduceMotion ? undefined : FadeIn.duration(400)}
          exiting={reduceMotion ? undefined : FadeOut.duration(300)}
          style={styles.subtext}
        >
          {subtext}
        </Animated.Text>
      </View>

      {!complete && <LoadingDots animate={!reduceMotion} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    gap: S.md,
  },
  headline: {
    ...T.cardTitle,
    fontSize: 22,
    lineHeight: 28,
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtextSlot: {
    minHeight: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S.lg,
  },
  subtext: {
    ...T.bodySm,
    fontSize: 15,
    lineHeight: 22,
    color: C.text2,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: S.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.volt,
    shadowColor: C.volt,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
