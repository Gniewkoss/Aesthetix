import React from 'react';
import Svg, { Circle, Rect, Polygon } from 'react-native-svg';

type Pose = 'front' | 'side' | 'back';

interface PoseSilhouetteProps {
  pose: Pose;
  width?: number;
  color?: string;
  opacity?: number;
}

/**
 * Minimal stylised body-guide drawn from primitives. Faint, premium, custom —
 * communicates the required pose without photographic clutter.
 */
export function PoseSilhouette({ pose, width = 120, color = '#C7F940', opacity = 0.16 }: PoseSilhouetteProps) {
  const height = width * 2;
  const isSide = pose === 'side';

  return (
    <Svg width={width} height={height} viewBox="0 0 120 240" opacity={opacity}>
      {isSide ? (
        <>
          {/* Profile head */}
          <Circle cx={66} cy={30} r={15} fill={color} />
          {/* Torso (leaning profile) */}
          <Polygon points="54,46 76,46 72,132 58,132" fill={color} />
          {/* Forward arm */}
          <Rect x={58} y={52} width={8} height={74} rx={4} fill={color} />
          {/* Legs together */}
          <Rect x={55} y={130} width={10} height={98} rx={5} fill={color} />
          <Rect x={63} y={130} width={10} height={98} rx={5} fill={color} />
        </>
      ) : (
        <>
          {/* Head */}
          <Circle cx={60} cy={28} r={15} fill={color} />
          {/* Shoulders → waist torso */}
          <Polygon points="42,48 78,48 71,130 49,130" fill={color} />
          {/* Arms (slightly out for back pose) */}
          <Rect x={pose === 'back' ? 28 : 31} y={50} width={8} height={76} rx={4} fill={color} />
          <Rect x={pose === 'back' ? 84 : 81} y={50} width={8} height={76} rx={4} fill={color} />
          {/* Legs */}
          <Rect x={49} y={130} width={10} height={98} rx={5} fill={color} />
          <Rect x={61} y={130} width={10} height={98} rx={5} fill={color} />
        </>
      )}
    </Svg>
  );
}
