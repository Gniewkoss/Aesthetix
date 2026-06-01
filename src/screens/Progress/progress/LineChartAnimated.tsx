import React, { useEffect, useRef } from 'react';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../../theme/obsidian';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

let _uid = 0;

interface LineChartAnimatedProps {
  data: number[];
  color: string;
  width: number;
  height?: number;
  reduceMotion: boolean;
}

const PAD = { top: 14, bottom: 14, left: 6, right: 6 };

/**
 * Line chart that draws itself on mount / when the series changes, by animating
 * strokeDashoffset along the path. Area fill + endpoint dot fade in with it.
 */
export function LineChartAnimated({ data, color, width, height = 150, reduceMotion }: LineChartAnimatedProps) {
  const gradId = useRef(`lc_${++_uid}`).current;
  const chartH = height - PAD.top - PAD.bottom;

  // Pad the value range so the line never hugs the top/bottom edge.
  const min = Math.min(...data) - 4;
  const max = Math.max(...data) + 4;
  const range = max - min || 1;
  const stepX = (width - PAD.left - PAD.right) / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const bottomY = PAD.top + chartH;
  const areaPath = `M ${pts[0].x},${bottomY} L ${pts.map((p) => `${p.x},${p.y}`).join(' L ')} L ${pts[pts.length - 1].x},${bottomY} Z`;
  const last = pts[pts.length - 1];

  // Approximate path length for the dash animation.
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
    // Re-animate whenever the series changes (metric toggle).
  }, [data, reduceMotion]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - draw.value) }));
  const fadeProps = useAnimatedProps(() => ({ opacity: draw.value }));

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Gridlines */}
      {[0, 0.5, 1].map((t) => {
        const y = PAD.top + t * chartH;
        return <Line key={t} x1={PAD.left} y1={y} x2={width - PAD.right} y2={y} stroke={C.border} strokeWidth={1} />;
      })}

      {/* Area fill */}
      <AnimatedPath d={areaPath} fill={`url(#${gradId})`} animatedProps={fadeProps} />

      {/* Line (draws on) */}
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

      {/* Endpoint dot */}
      <AnimatedCircle cx={last.x} cy={last.y} r={4.5} fill={C.canvas} stroke={color} strokeWidth={2.5} animatedProps={fadeProps} />
    </Svg>
  );
}
