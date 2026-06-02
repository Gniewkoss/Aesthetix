import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface PoseSideSilhouetteProps {
  width: number;
  fill: string;
  opacity?: number;
}

/**
 * Profile mannequin for the optional side photo (single-path, high contrast).
 */
export function PoseSideSilhouette({ width, fill, opacity = 1 }: PoseSideSilhouetteProps) {
  const height = width * 2.12;
  return (
    <Svg width={width} height={height} viewBox="0 0 88 186" opacity={opacity}>
      <Circle cx="54" cy="17" r="11" fill={fill} />
      <Path
        fill={fill}
        d="M44 30c-4 2-6 12-5 24l-1 8c-2 18-4 38-3 58l2 42c1 8-2 14-8 16h-6c5-4 6-10 5-18l-2-44c-1-22 1-42 4-60l1-10c1-10 5-18 12-20 3-1 6-1 9 2z"
      />
      <Path fill={fill} d="M46 48c8 4 14 10 16 22l-2 34c-1 6-5 10-11 10s-8-5-7-12l3-32c1-12 6-18 11-22z" />
      <Path fill={fill} d="M38 92c-6 0-10 6-11 14l-3 48c-1 10 4 18 12 20 4 1 8-1 10-5l4-52c1-8-3-16-12-25z" />
      <Path fill={fill} d="M48 92c5 2 9 8 10 16l5 52c1 8-2 15-9 17-6 2-12-2-14-9l-4-50c-1-10 4-20 12-26z" />
    </Svg>
  );
}
