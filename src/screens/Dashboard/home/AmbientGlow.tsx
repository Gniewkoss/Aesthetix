import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { C } from '../../../theme/obsidian';

/**
 * Soft Volt bloom anchored to the top-right corner. Uses a RADIAL gradient so
 * the light falls off smoothly in every direction (a linear gradient leaves a
 * visible diagonal band, and flat low-opacity lime over black reads as muddy
 * olive). Decorative only — never intercepts touches.
 */
export function AmbientGlow() {
  return (
    <Svg style={styles.glow} pointerEvents="none">
      <Defs>
        <RadialGradient id="voltGlow" cx="80%" cy="0%" r="75%">
          <Stop offset="0" stopColor={C.volt} stopOpacity={0.13} />
          <Stop offset="0.5" stopColor={C.volt} stopOpacity={0.035} />
          <Stop offset="1" stopColor={C.volt} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#voltGlow)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
});
