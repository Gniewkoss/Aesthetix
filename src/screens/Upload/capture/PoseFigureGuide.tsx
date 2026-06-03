import React from 'react';
import { View, StyleSheet } from 'react-native';
import Body from 'react-native-body-highlighter';
import { C } from '../../../theme/obsidian';

type Pose = 'front' | 'back';

/** Hero overlay width in `PoseFrame` (chips keep their own smaller width). */
export const POSE_GUIDE_FRAME_WIDTH = 144;

interface PoseFigureGuideProps {
  pose: Pose;
  /** Target width of the figure (px). */
  width?: number;
  opacity?: number;
}

const BODY_BASE_WIDTH = 200;
const GHOST_FILL = 'rgba(199, 249, 64, 0.55)';

/** Capture Studio pose overlays — `react-native-body-highlighter` ghost (front / back only). */
export function PoseFigureGuide({ pose, width = 140, opacity = 1 }: PoseFigureGuideProps) {
  const scale = width / BODY_BASE_WIDTH;
  const height = scale * 400;

  return (
    <View style={[styles.wrap, { width, height, opacity }]} pointerEvents="none">
      <Body
        data={[]}
        side={pose === 'back' ? 'back' : 'front'}
        gender="male"
        scale={scale}
        border="none"
        defaultFill={GHOST_FILL}
        defaultStroke="none"
        defaultStrokeWidth={0}
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
