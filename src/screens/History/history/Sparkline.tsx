import React from 'react';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { C } from '../../../theme/obsidian';

interface SparklineProps {
  /** Scores in chronological order (oldest → newest). */
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Minimal trend line for the progress summary. Renders a soft area fill + line
 * + an endpoint dot. Purely presentational; no animation (it's a micro-element).
 */
export function Sparkline({ data, width = 132, height = 48, color = C.volt }: SparklineProps) {
  if (data.length < 2) return null;

  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${height} ${line} ${width - pad},${height}`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Polygon points={area} fill="url(#sparkFill)" />
      <Polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={last.x} cy={last.y} r={3.5} fill={color} />
    </Svg>
  );
}
