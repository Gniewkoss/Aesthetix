import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import { COLORS } from '../../theme';

interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
  color?: string;
}

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

function polarToCartesian(angle: number, radius: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function buildPolygonPoints(values: number[], maxRadius: number, cx: number, cy: number, count: number) {
  return values
    .map((v, i) => {
      const angle = (360 / count) * i;
      const r = (v / 100) * maxRadius;
      const pt = polarToCartesian(angle, r, cx, cy);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

export function RadarChart({ data, size = 220, color = COLORS.cyan }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = (size / 2) * 0.72;
  const count = data.length;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, []);

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = buildPolygonPoints(
    data.map((d) => d.value),
    maxRadius,
    cx,
    cy,
    count
  );

  return (
    <View>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.08" />
          </LinearGradient>
        </Defs>

        {/* Grid rings */}
        {gridLevels.map((level, li) => {
          const pts = Array.from({ length: count }).map((_, i) => {
            const angle = (360 / count) * i;
            const r = level * maxRadius;
            const pt = polarToCartesian(angle, r, cx, cy);
            return `${pt.x},${pt.y}`;
          }).join(' ');
          return (
            <Polygon
              key={li}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = (360 / count) * i;
          const end = polarToCartesian(angle, maxRadius, cx, cy);
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill="url(#radarGrad)"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {data.map((d, i) => {
          const angle = (360 / count) * i;
          const r = (d.value / 100) * maxRadius;
          const pt = polarToCartesian(angle, r, cx, cy);
          return (
            <Circle key={i} cx={pt.x} cy={pt.y} r={4} fill={color} opacity={0.9} />
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const angle = (360 / count) * i;
          const labelR = maxRadius + 20;
          const pt = polarToCartesian(angle, labelR, cx, cy);
          return (
            <SvgText
              key={i}
              x={pt.x}
              y={pt.y + 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.55)"
              fontSize={9}
              fontWeight="600"
            >
              {d.label.toUpperCase()}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
