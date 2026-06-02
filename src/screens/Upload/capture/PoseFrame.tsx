import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { CachedImage } from '../../../components/ui/CachedImage';
import { C, T, R, S } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';
import { PoseBodyGuide } from './PoseBodyGuide';

type Pose = 'front' | 'side' | 'back';

interface PoseFrameProps {
  pose: Pose;
  label: string;
  requirement: string;
  reqColor: string;
  bodyHint: string;
  uri?: string;
  reduceMotion: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
}

function Viewfinder({ color, showBottom }: { color: string; showBottom: boolean }) {
  return (
    <>
      <View pointerEvents="none" style={[styles.bracket, styles.tl, { borderColor: color }]} />
      <View pointerEvents="none" style={[styles.bracket, styles.tr, { borderColor: color }]} />
      {showBottom && (
        <>
          <View pointerEvents="none" style={[styles.bracket, styles.bl, { borderColor: color }]} />
          <View pointerEvents="none" style={[styles.bracket, styles.br, { borderColor: color }]} />
        </>
      )}
    </>
  );
}

export function PoseFrame({
  pose, label, requirement, reqColor, bodyHint, uri, reduceMotion, onCamera, onGallery, onRemove,
}: PoseFrameProps) {
  const [h, setH] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height);

  // One-shot scan sweep when a photo lands; gentle bracket breathing when empty.
  const sweep = useSharedValue(0);
  useEffect(() => {
    if (uri && !reduceMotion && h > 0) {
      sweep.value = 0;
      sweep.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) });
    }
  }, [uri, h, reduceMotion]);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * h }],
    opacity: uri ? (1 - sweep.value) * 0.9 : 0,
  }));

  const pulse = useSharedValue(0.5);
  useEffect(() => {
    if (uri || reduceMotion) { pulse.value = 0.5; return; }
    pulse.value = withRepeat(withSequence(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.45, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
  }, [uri, reduceMotion]);
  const guideStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.frame} onLayout={onLayout}>
      {uri ? (
        <>
          <CachedImage uri={uri} style={StyleSheet.absoluteFill} accessibilityLabel={`${label} photo`} />
          <LinearGradient colors={['rgba(10,11,13,0.5)', 'transparent', 'rgba(10,11,13,0.75)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {/* Scan sweep */}
          <Animated.View style={[styles.sweep, sweepStyle]} pointerEvents="none">
            <LinearGradient colors={['transparent', C.volt, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>

          <Viewfinder color={C.volt} showBottom />

          {/* Ready chip */}
          <View style={styles.readyChip}>
            <Ionicons name="checkmark-circle" size={14} color={C.voltInk} />
            <Text style={[T.overline, { color: C.voltInk }]}>READY</Text>
          </View>

          {/* Retake */}
          <PressableScale onPress={onRemove} accessibilityLabel={`Retake ${label}`} style={styles.retake}>
            <Ionicons name="refresh" size={15} color={C.text} />
            <Text style={[T.label, { color: C.text }]}>Retake</Text>
          </PressableScale>
        </>
      ) : (
        <>
          <Viewfinder color={C.borderHi} showBottom={false} />

          <Animated.View style={[styles.guide, guideStyle]} pointerEvents="none">
            <PoseBodyGuide pose={pose} scale={1.08} />
          </Animated.View>

          <View style={styles.emptyTop}>
            <View style={[styles.reqPill, { backgroundColor: reqColor + '1A', borderColor: reqColor + '40' }]}>
              <Text style={[T.overline, { color: reqColor }]}>{requirement.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.emptyBottom}>
            <Text style={[T.bodySm, { color: C.text2, textAlign: 'center', marginBottom: S.md }]}>{bodyHint}</Text>
            <View style={styles.actions}>
              <PressableScale onPress={onCamera} accessibilityLabel={`Take ${label} photo`} style={[styles.actionBtn, styles.actionPrimary]}>
                <Ionicons name="camera" size={18} color={C.voltInk} />
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: C.voltInk, includeFontPadding: false }}>Camera</Text>
              </PressableScale>
              <PressableScale onPress={onGallery} accessibilityLabel={`Choose ${label} from library`} style={[styles.actionBtn, styles.actionGhost]}>
                <Ionicons name="images-outline" size={18} color={C.text} />
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: C.text, includeFontPadding: false }}>Upload</Text>
              </PressableScale>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    borderRadius: R['2xl'],
    overflow: 'hidden',
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
  },
  bracket: { position: 'absolute', width: 26, height: 26 },
  tl: { top: 14, left: 14, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 10 },
  tr: { top: 14, right: 14, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 10 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 10 },
  br: { bottom: 14, right: 14, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 10 },

  sweep: { position: 'absolute', left: 0, right: 0, top: 0, height: 3 },

  guide: {
    position: 'absolute',
    top: 52,
    left: S.lg,
    right: S.lg,
    bottom: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTop: { position: 'absolute', top: 18, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  reqPill: { paddingHorizontal: S.md, paddingVertical: 5, borderRadius: R.pill, borderWidth: 1 },

  emptyBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: S.lg,
    paddingTop: S.lg,
    paddingBottom: S.lg,
    backgroundColor: 'rgba(10,11,13,0.92)',
    borderTopWidth: 1,
    borderTopColor: C.border,
    zIndex: 2,
  },
  actions: { flexDirection: 'row', gap: S.sm },
  actionBtn: { flex: 1, height: 48, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm },
  actionPrimary: { backgroundColor: C.volt },
  actionGhost: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderMd },

  readyChip: {
    position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.volt, paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.pill,
  },
  retake: {
    position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(10,11,13,0.6)', borderWidth: 1, borderColor: C.borderMd,
    paddingHorizontal: S.base, paddingVertical: 9, borderRadius: R.pill,
  },
});
