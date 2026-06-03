import React, { useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle, Rect, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { CachedImage } from '../../../components/ui/CachedImage';
import { C } from '../../../theme/obsidian';

interface ScanStageProps {
  imageUris: string[];
  percent: number;
  complete: boolean;
  reduceMotion: boolean;
}

// Biometric landmarks (fractions of the frame) — lit progressively as the AI "detects" them.
const NODES = [
  { x: 0.33, y: 0.28 }, // L shoulder
  { x: 0.67, y: 0.28 }, // R shoulder
  { x: 0.5, y: 0.4 },   // chest
  { x: 0.5, y: 0.56 },  // core
  { x: 0.4, y: 0.76 },  // L quad
  { x: 0.6, y: 0.76 },  // R quad
];
const LINKS: [number, number][] = [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [3, 5]];

export function ScanStage({ imageUris, percent, complete, reduceMotion }: ScanStageProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const litCount = complete ? NODES.length : Math.round((percent / 100) * NODES.length);
  const isLit = (i: number) => complete || i < litCount;

  // Scan beam loop
  const beam = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion || complete) { beam.value = withTiming(complete ? 1 : 0, { duration: 300 }); return; }
    beam.value = 0;
    beam.value = withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [reduceMotion, complete]);
  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: beam.value * size.h }],
    opacity: complete ? 0 : 0.9,
  }));

  // Neural-net breathing
  const pulse = useSharedValue(0.6);
  useEffect(() => {
    if (reduceMotion) { pulse.value = 1; return; }
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion]);
  const netStyle = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.45 }));

  return (
    <View style={styles.frame} onLayout={onLayout}>
      {imageUris[0] ? (
        <CachedImage uri={imageUris[0]} style={StyleSheet.absoluteFill} accessibilityLabel="Scan photo" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surface2 }]} />
      )}

      {/* Darken + tint for legibility of the scan layer */}
      <LinearGradient colors={['rgba(10,11,13,0.55)', 'rgba(10,11,13,0.35)', 'rgba(10,11,13,0.7)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* Scan grid + neural net */}
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgGrad id="scanGrid" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.volt} stopOpacity={0.05} />
              <Stop offset="1" stopColor={C.volt} stopOpacity={0.02} />
            </SvgGrad>
          </Defs>
          {/* grid lines */}
          {Array.from({ length: 6 }).map((_, i) => (
            <Line key={`v${i}`} x1={(size.w / 6) * (i + 0.5)} y1={0} x2={(size.w / 6) * (i + 0.5)} y2={size.h} stroke="url(#scanGrid)" strokeWidth={1} />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={(size.h / 9) * (i + 0.5)} x2={size.w} y2={(size.h / 9) * (i + 0.5)} stroke="url(#scanGrid)" strokeWidth={1} />
          ))}
        </Svg>
      )}

      {/* Neural landmark net */}
      {size.w > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, netStyle]} pointerEvents="none">
          <Svg width={size.w} height={size.h}>
            {LINKS.map(([a, b], i) => {
              const lit = isLit(a) && isLit(b);
              return (
                <Line
                  key={i}
                  x1={NODES[a].x * size.w} y1={NODES[a].y * size.h}
                  x2={NODES[b].x * size.w} y2={NODES[b].y * size.h}
                  stroke={lit ? C.volt : 'rgba(255,255,255,0.16)'}
                  strokeWidth={lit ? 1.5 : 1}
                />
              );
            })}
            {NODES.map((n, i) => {
              const lit = isLit(i);
              return (
                <React.Fragment key={i}>
                  {lit && <Circle cx={n.x * size.w} cy={n.y * size.h} r={9} fill={C.volt} fillOpacity={0.18} />}
                  <Circle
                    cx={n.x * size.w} cy={n.y * size.h} r={lit ? 4.5 : 3}
                    fill={lit ? C.volt : 'rgba(255,255,255,0.3)'}
                    stroke={lit ? C.canvas : 'transparent'} strokeWidth={lit ? 1.5 : 0}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </Animated.View>
      )}

      {/* Scan beam */}
      <Animated.View style={[styles.beam, beamStyle]} pointerEvents="none">
        <LinearGradient colors={['transparent', C.volt, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Corner brackets */}
      <View style={[styles.bracket, styles.tl]} pointerEvents="none" />
      <View style={[styles.bracket, styles.tr]} pointerEvents="none" />
      <View style={[styles.bracket, styles.bl]} pointerEvents="none" />
      <View style={[styles.bracket, styles.br]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    aspectRatio: 0.72,
    alignSelf: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.voltBorder,
    maxWidth: '100%',
  },
  beam: { position: 'absolute', left: 0, right: 0, top: 0, height: 3, shadowColor: C.volt, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  bracket: { position: 'absolute', width: 24, height: 24, borderColor: C.volt },
  tl: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 10 },
  tr: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 10 },
  bl: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 10 },
  br: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 10 },
});
