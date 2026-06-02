import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { C } from '../../../theme/obsidian';

type Pose = 'front' | 'side' | 'back';

interface PoseBodyGuideProps {
  pose: Pose;
  scale?: number;
}

const GUIDE_FILL = 'rgba(199, 249, 64, 0.28)';
const GUIDE_STROKE = 'rgba(199, 249, 64, 0.45)';
const GUIDE_DIM = 'rgba(255, 255, 255, 0.06)';

const FRONT_SLUGS: Slug[] = [
  'chest', 'abs', 'obliques', 'deltoids', 'biceps', 'triceps', 'forearm',
  'quadriceps', 'calves', 'neck', 'head',
];

const BACK_SLUGS: Slug[] = [
  'upper-back', 'lower-back', 'trapezius', 'deltoids', 'triceps', 'forearm',
  'gluteal', 'hamstring', 'calves', 'neck', 'head',
];

/** Left-side emphasis reads as a profile cue for the optional side photo. */
const SIDE_SLUGS: Slug[] = [
  'chest', 'abs', 'obliques', 'deltoids', 'biceps', 'forearm', 'quadriceps', 'calves',
];

function uniformParts(slugs: Slug[], color: string): ExtendedBodyPart[] {
  return slugs.map((slug) => ({
    slug,
    color,
    styles: { stroke: GUIDE_STROKE, strokeWidth: 0.6 },
  }));
}

function sideProfileParts(): ExtendedBodyPart[] {
  return SIDE_SLUGS.map((slug) => ({
    slug,
    side: 'left' as const,
    color: GUIDE_FILL,
    styles: { stroke: GUIDE_STROKE, strokeWidth: 0.7 },
  }));
}

/**
 * Anatomical pose guide using the same body map asset as muscle analysis.
 */
export function PoseBodyGuide({ pose, scale = 1.05 }: PoseBodyGuideProps) {
  const side = pose === 'back' ? 'back' : 'front';
  const data = useMemo<ExtendedBodyPart[]>(() => {
    if (pose === 'side') return sideProfileParts();
    const slugs = pose === 'back' ? BACK_SLUGS : FRONT_SLUGS;
    return uniformParts(slugs, GUIDE_FILL);
  }, [pose]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Body
        data={data}
        side={side}
        gender="male"
        scale={scale}
        defaultFill={pose === 'side' ? GUIDE_DIM : 'rgba(255,255,255,0.04)'}
        defaultStroke="rgba(255,255,255,0.12)"
        defaultStrokeWidth={0.5}
        border="rgba(199, 249, 64, 0.12)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxHeight: '100%',
  },
});
