import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, T, R, S } from '../../../theme/obsidian';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

let _uid = 0;

interface LineChartAnimatedProps {
  data: number[];
  color: string;
  width: number;
  height?: number;
  reduceMotion: boolean;
  /** Date labels per point, used in the scrub tooltip. */
  labels?: string[];
  unit?: string;
}

const PAD = { top: 14, bottom: 14, left: 6, right: 6 };
const TOOLTIP_W = 96;

/**
 * Line chart that draws itself on mount / when the series changes. Long-press
 * then drag to scrub: a marker snaps to the nearest data point and a tooltip
 * shows its value + date. (Spec §6.3 — scrubbable data.)
 */
export function LineChartAnimated({
  data, color, width, height = 150, reduceMotion, labels, unit = '',
}: LineChartAnimatedProps) {
  const gradId = useRef(`lc_${++_uid}`).current;
  const chartH = height - PAD.top - PAD.bottom;

  const min = Math.min(...data) - 4;
  const max = Math.max(...data) + 4;
  const range = max - min || 1;
  const stepX = (width - PAD.left - PAD.right) / (data.length - 1);
  const n = data.length;

  const pts = data.map((v, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const bottomY = PAD.top + chartH;
  const areaPath = `M ${pts[0].x},${bottomY} L ${pts.map((p) => `${p.x},${p.y}`).join(' L ')} L ${pts[pts.length - 1].x},${bottomY} Z`;
  const last = pts[pts.length - 1];

  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }

  const draw = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    draw.value = reduceMotion ? 1 : 0;
    if (!reduceMotion) {
      draw.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    }
  }, [data, reduceMotion]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - draw.value) }));
  const fadeProps = useAnimatedProps(() => ({ opacity: draw.value }));

  // ── Scrub state ──────────────────────────────────────────────
  const [active, setActive] = useState<number | null>(null);
  const idxRef = useRef<number | null>(null);

  const setIdx = (i: number | null) => {
    if (i === idxRef.current) return;
    idxRef.current = i;
    if (i !== null) Haptics.selectionAsync();
    setActive(i);
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(180)
    .minDistance(0)
    .onStart((e) => {
      'worklet';
      const i = Math.max(0, Math.min(n - 1, Math.round((e.x - PAD.left) / stepX)));
      runOnJS(setIdx)(i);
    })
    .onUpdate((e) => {
      'worklet';
      const i = Math.max(0, Math.min(n - 1, Math.round((e.x - PAD.left) / stepX)));
      runOnJS(setIdx)(i);
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(setIdx)(null);
    });

  // ── Tooltip / marker geometry ────────────────────────────────
  let marker: { p: { x: number; y: number }; value: number; label?: string; left: number; top: number } | null = null;
  if (active !== null && pts[active]) {
    const p = pts[active];
    const left = Math.max(0, Math.min(width - TOOLTIP_W, p.x - TOOLTIP_W / 2));
    const top = p.y - 58 < 0 ? p.y + 16 : p.y - 58;
    marker = { p, value: data[active], label: labels?.[active], left, top };
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.22} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {[0, 0.5, 1].map((t) => {
          const y = PAD.top + t * chartH;
          return <Line key={t} x1={PAD.left} y1={y} x2={width - PAD.right} y2={y} stroke={C.border} strokeWidth={1} />;
        })}

        <AnimatedPath d={areaPath} fill={`url(#${gradId})`} animatedProps={fadeProps} />
        <AnimatedPath
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={length}
          animatedProps={lineProps}
        />
        <AnimatedCircle cx={last.x} cy={last.y} r={4.5} fill={C.canvas} stroke={color} strokeWidth={2.5} animatedProps={fadeProps} />

        {/* Scrub guide line + emphasized marker */}
        {marker && (
          <>
            <Line x1={marker.p.x} y1={PAD.top} x2={marker.p.x} y2={bottomY} stroke={color} strokeWidth={1} strokeOpacity={0.4} />
            <Circle cx={marker.p.x} cy={marker.p.y} r={8} fill={color} fillOpacity={0.18} />
            <Circle cx={marker.p.x} cy={marker.p.y} r={4.5} fill={C.canvas} stroke={color} strokeWidth={2.5} />
          </>
        )}
      </Svg>

      {/* Tooltip (RN overlay, non-interactive) */}
      {marker && (
        <View
          pointerEvents="none"
          style={[styles.tooltip, { left: marker.left, top: marker.top, borderColor: color + '40' }]}
        >
          <Text style={[T.metricSm, { color }]}>{Math.round(marker.value)}{unit}</Text>
          {marker.label ? <Text style={[T.caption, { color: C.text3 }]}>{marker.label}</Text> : null}
        </View>
      )}

      {/* Transparent gesture surface on top */}
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    width: TOOLTIP_W,
    alignItems: 'center',
    gap: 1,
    backgroundColor: C.surface3,
    borderWidth: 1,
    borderRadius: R.md,
    paddingVertical: S.sm,
    paddingHorizontal: S.sm,
  },
});
