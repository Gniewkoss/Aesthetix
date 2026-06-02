import React from 'react';
import { Platform, Text, TextStyle, View } from 'react-native';
import { T } from '../../../theme/obsidian';
import { AnimatedCount } from './AnimatedCount';

interface RingScoreProps {
  value: number;
  color: string;
  fontSize?: number;
  instant?: boolean;
}

/** Display / semi-bold numerals sit optically high in a square box — nudge down to true center. */
export function opticalNudgeY(fontSize: number): number {
  return Math.round(fontSize * (Platform.OS === 'android' ? 0.14 : 0.12));
}

/**
 * Score digit centered inside a VoltRing (X + Y). Uses Text when static;
 * AnimatedCount only while counting.
 */
export function RingScore({ value, color, fontSize = 48, instant = false }: RingScoreProps) {
  const nudgeY = opticalNudgeY(fontSize);

  const textStyle: TextStyle = {
    fontFamily: T.heroNum.fontFamily,
    fontSize,
    lineHeight: fontSize,
    letterSpacing: T.heroNum.letterSpacing,
    fontVariant: T.heroNum.fontVariant,
    color,
    textAlign: 'center',
    includeFontPadding: false,
    transform: [{ translateY: nudgeY }],
  };

  if (instant) {
    return (
      <View style={styles.slot} pointerEvents="none">
        <Text style={textStyle}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.slot} pointerEvents="none">
      <AnimatedCount
        value={value}
        instant={false}
        style={[
          textStyle,
          {
            padding: 0,
            margin: 0,
            borderWidth: 0,
            backgroundColor: 'transparent',
          },
        ]}
      />
    </View>
  );
}

const styles = {
  slot: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
