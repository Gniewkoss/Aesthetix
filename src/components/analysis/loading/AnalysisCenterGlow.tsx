import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { C } from '../../../theme/obsidian';

/** Soft focal bloom behind the loader — avoids muddy solid overlays. */
export function AnalysisCenterGlow() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="centerGlow" cx="50%" cy="42%" r="42%">
            <Stop offset="0%" stopColor={C.volt} stopOpacity={0.09} />
            <Stop offset="55%" stopColor={C.volt} stopOpacity={0.03} />
            <Stop offset="100%" stopColor={C.canvas} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#centerGlow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
