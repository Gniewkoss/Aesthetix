import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { CachedImage } from '../../../components/ui/CachedImage';
import { C, T, R, S } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';
import { PoseFigureGuide, POSE_GUIDE_FRAME_WIDTH } from './PoseFigureGuide';

type Pose = 'front' | 'back';

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

const BRACKET_SIZE = 28;
const BRACKET_EDGE = 10;
/** Outer card radius — concentric with corner bracket arcs. */
const FRAME_RADIUS = R['2xl'];
const BRACKET_CORNER_RADIUS = FRAME_RADIUS - BRACKET_EDGE;
/** Horizontal clearance so controls sit between the bottom corner brackets. */
const CORNER_GUTTER = BRACKET_SIZE + BRACKET_EDGE + S.sm;
/** Lift hint + action buttons above the bottom corner brackets. */
const CONTROLS_BOTTOM = BRACKET_EDGE + 28;

function Viewfinder({ color }: { color: string }) {
  return (
    <>
      <View pointerEvents="none" style={[styles.bracket, styles.tl, { borderColor: color }]} />
      <View pointerEvents="none" style={[styles.bracket, styles.tr, { borderColor: color }]} />
      <View pointerEvents="none" style={[styles.bracket, styles.bl, { borderColor: color }]} />
      <View pointerEvents="none" style={[styles.bracket, styles.br, { borderColor: color }]} />
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

          <Viewfinder color={C.volt} />

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
          <Viewfinder color={C.borderHi} />

          <Animated.View style={[styles.guide, guideStyle]} pointerEvents="none">
            <PoseFigureGuide pose={pose} width={POSE_GUIDE_FRAME_WIDTH} />
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
    overflow: 'hidden',
    backgroundColor: C.surface1,
    borderRadius: FRAME_RADIUS,
    borderWidth: 1,
    borderColor: C.borderMd,
  },
  bracket: { position: 'absolute', width: BRACKET_SIZE, height: BRACKET_SIZE },
  tl: {
    top: BRACKET_EDGE, left: BRACKET_EDGE,
    borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: BRACKET_CORNER_RADIUS,
  },
  tr: {
    top: BRACKET_EDGE, right: BRACKET_EDGE,
    borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: BRACKET_CORNER_RADIUS,
  },
  bl: {
    bottom: BRACKET_EDGE, left: BRACKET_EDGE,
    borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: BRACKET_CORNER_RADIUS,
  },
  br: {
    bottom: BRACKET_EDGE, right: BRACKET_EDGE,
    borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: BRACKET_CORNER_RADIUS,
  },

  sweep: { position: 'absolute', left: 0, right: 0, top: 0, height: 3 },

  guide: {
    position: 'absolute',
    top: BRACKET_SIZE + BRACKET_EDGE + 36,
    left: CORNER_GUTTER,
    right: CORNER_GUTTER,
    bottom: CONTROLS_BOTTOM + 96,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTop: {
    position: 'absolute',
    top: BRACKET_EDGE + S.sm,
    left: CORNER_GUTTER,
    right: CORNER_GUTTER,
    alignItems: 'center',
    zIndex: 2,
  },
  reqPill: { paddingHorizontal: S.md, paddingVertical: 5, borderRadius: R.pill, borderWidth: 1 },

  emptyBottom: {
    position: 'absolute',
    left: CORNER_GUTTER,
    right: CORNER_GUTTER,
    bottom: CONTROLS_BOTTOM,
    alignItems: 'center',
    zIndex: 2,
  },
  actions: { flexDirection: 'row', gap: S.sm },
  actionBtn: { flex: 1, height: 48, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm },
  actionPrimary: { backgroundColor: C.volt },
  actionGhost: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderMd },

  readyChip: {
    position: 'absolute',
    top: BRACKET_EDGE + S.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.volt,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: R.pill,
    zIndex: 2,
  },
  retake: {
    position: 'absolute',
    bottom: CONTROLS_BOTTOM,
    left: CORNER_GUTTER,
    right: CORNER_GUTTER,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,11,13,0.6)', borderWidth: 1, borderColor: C.borderMd,
    paddingHorizontal: S.base, paddingVertical: 9, borderRadius: R.pill,
  },
});
