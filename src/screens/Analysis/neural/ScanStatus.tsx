import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn, FadeOut, SharedValue,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { C, T, R, S } from '../../../theme/obsidian';
import { ANALYSIS_SUBTEXTS, SUBTEXT_ROTATE_MS, resolveStepLabel } from '../../../components/analysis/loading/constants';

interface ScanStatusProps {
  progress: SharedValue<number>;
  percent: number;
  backendStep: string;
  complete: boolean;
  reduceMotion: boolean;
}

export function ScanStatus({ progress, percent, backendStep, complete, reduceMotion }: ScanStatusProps) {
  const [rotateIndex, setRotateIndex] = useState(0);
  const [trackW, setTrackW] = useState(0);

  useEffect(() => {
    if (complete) return;
    const id = setInterval(() => setRotateIndex((i) => (i + 1) % ANALYSIS_SUBTEXTS.length), SUBTEXT_ROTATE_MS);
    return () => clearInterval(id);
  }, [complete]);

  // Pulsing live dot
  const dot = useSharedValue(0.4);
  useEffect(() => {
    if (reduceMotion) { dot.value = 1; return; }
    dot.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: complete ? 1 : 0.35 + dot.value * 0.65 }));

  const fillStyle = useAnimatedStyle(() => ({ width: trackW * progress.value }));
  const onTrackLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  const label = complete ? 'Analysis complete' : resolveStepLabel(backendStep, rotateIndex);

  return (
    <View style={styles.wrap}>
      <View style={styles.eyebrowRow}>
        <Animated.View style={[styles.liveDot, dotStyle, complete && { backgroundColor: C.success }]} />
        <Text style={[T.overline, { color: complete ? C.success : C.volt }]}>
          {complete ? 'COMPLETE' : 'AI ANALYSIS'}
        </Text>
      </View>

      {/* Percent */}
      <View style={styles.percentRow}>
        <Text style={styles.percentValue}>{percent}</Text>
        <Text style={styles.percentUnit}>%</Text>
      </View>

      {/* Step */}
      <View style={styles.stepSlot}>
        <Animated.Text
          key={label}
          entering={reduceMotion ? undefined : FadeIn.duration(300)}
          exiting={reduceMotion ? undefined : FadeOut.duration(200)}
          style={[T.bodySm, { color: C.text2 }]}
        >
          {label}
        </Animated.Text>
      </View>

      {/* Progress line */}
      <View style={styles.track} onLayout={onTrackLayout}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: S.sm },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.volt },

  percentRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 },
  percentValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 56, lineHeight: 58, letterSpacing: -2, color: C.text, fontVariant: ['tabular-nums'], includeFontPadding: false },
  percentUnit: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 20, lineHeight: 26, color: C.volt, marginLeft: 3, marginTop: 4 },

  stepSlot: { minHeight: 22, justifyContent: 'center', alignItems: 'center' },

  track: { width: '100%', maxWidth: 280, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: R.pill, overflow: 'hidden', marginTop: S.sm },
  fill: { height: '100%', backgroundColor: C.volt, borderRadius: R.pill },
});
