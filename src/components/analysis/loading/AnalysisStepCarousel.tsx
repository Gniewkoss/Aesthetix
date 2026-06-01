import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import {
  ANALYSIS_HEADLINE,
  ANALYSIS_SUBTEXTS,
  SUBTEXT_ROTATE_MS,
  resolveStepLabel,
} from './constants';

interface AnalysisStepCarouselProps {
  backendStep: string;
  complete?: boolean;
}

export function AnalysisStepCarousel({ backendStep, complete = false }: AnalysisStepCarouselProps) {
  const [rotateIndex, setRotateIndex] = React.useState(0);

  useEffect(() => {
    if (complete) return;
    const id = setInterval(() => {
      setRotateIndex((i) => (i + 1) % ANALYSIS_SUBTEXTS.length);
    }, SUBTEXT_ROTATE_MS);
    return () => clearInterval(id);
  }, [complete]);

  // Pulsing activity dot
  const pulse = useSharedValue(0.4);
  useEffect(() => {
    pulse.value = complete ? 1 : withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [complete]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const subtext = complete ? 'Preparing your results' : resolveStepLabel(backendStep, rotateIndex);

  return (
    <View style={styles.wrap}>
      <View style={styles.statusCard}>
        <View style={styles.headlineRow}>
          <Animated.View style={[styles.dot, dotStyle]} />
          <Text style={[T.cardTitle, styles.headline]}>
            {complete ? 'Analysis complete' : ANALYSIS_HEADLINE}
          </Text>
        </View>

        <View style={styles.subtextSlot}>
          <Animated.Text
            key={subtext}
            entering={FadeIn.duration(350)}
            exiting={FadeOut.duration(250)}
            style={[T.bodySm, styles.subtext]}
          >
            {subtext}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  statusCard: {
    backgroundColor: C.surface1,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: S.lg,
    paddingHorizontal: LAYOUT.cardPad,
    alignItems: 'center',
  },
  headlineRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.volt },
  headline: { color: C.text, fontSize: 16, textAlign: 'center' },
  subtextSlot: { minHeight: 20, justifyContent: 'center', alignItems: 'center' },
  subtext: { color: C.text3, textAlign: 'center' },
});
