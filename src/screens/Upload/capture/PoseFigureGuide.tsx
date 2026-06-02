import React from 'react';
import { View, StyleSheet } from 'react-native';
import Body from 'react-native-body-highlighter';
import { C } from '../../../theme/obsidian';
import { PoseSideSilhouette } from './PoseSideSilhouette';

type Pose = 'front' | 'side' | 'back';

interface PoseFigureGuideProps {
  pose: Pose;
  /** Target width of the figure (px). */
  width?: number;
  opacity?: number;
}

const GUIDE_FILL = 'rgba(199, 249, 64, 0.42)';
const GUIDE_STROKE = 'rgba(199, 249, 64, 0.72)';

/** Body map renders at scale 1.0 ≈ 200×400 px. */
const BODY_BASE_WIDTH = 200;

/**
 * Pose guides for capture: anatomical mannequin (front/back) + profile SVG (side).
 * Uses react-native-body-highlighter (already in the app for muscle maps).
 */
export function PoseFigureGuide({ pose, width = 140, opacity = 1 }: PoseFigureGuideProps) {
  if (pose === 'side') {
    return (
      <View style={styles.wrap} pointerEvents="none">
        <PoseSideSilhouette width={width * 0.88} fill={C.volt} opacity={opacity * 0.9} />
      </View>
    );
  }

  const scale = width / BODY_BASE_WIDTH;
  const height = (width / BODY_BASE_WIDTH) * 400;

  return (
    <View style={[styles.wrap, { width, height, opacity }]} pointerEvents="none">
      <Body
        data={[]}
        side={pose === 'back' ? 'back' : 'front'}
        gender="male"
        scale={scale}
        border="none"
        defaultFill={GUIDE_FILL}
        defaultStroke={GUIDE_STROKE}
        defaultStrokeWidth={1.1}
        hiddenParts={['hair']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
