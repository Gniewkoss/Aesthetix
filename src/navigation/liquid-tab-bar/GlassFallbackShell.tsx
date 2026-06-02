import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GLASS_PAD_H,
  GLASS_PAD_V,
  GLASS_RADIUS,
} from './constants';
import { GlassCapsuleRim } from './GlassCapsuleRim';
import { capsuleClip } from './glassCapsule';

type Props = {
  children: React.ReactNode;
};

/** Frosted glass fallback — Apple Music outer bar */
export function GlassFallbackShell({ children }: Props) {
  const blurTint = Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark';
  const clip = capsuleClip(GLASS_RADIUS);

  return (
    <View style={[styles.outer, clip]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 76 : 70}
        tint={blurTint as 'dark'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFillObject, clip]}
      />

      <View style={[styles.frostBase, clip]} pointerEvents="none" />

      <LinearGradient
        colors={[
          'rgba(255,255,255,0.10)',
          'rgba(255,255,255,0.035)',
          'transparent',
        ]}
        locations={[0, 0.25, 0.6]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFillObject, clip]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.12)']}
        locations={[0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFillObject, clip]}
        pointerEvents="none"
      />

      <GlassCapsuleRim radius={GLASS_RADIUS} />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    // Opaque-enough base so the capsule is visibly styled on first paint,
    // before BlurView lazily renders (it otherwise looks transparent until a
    // tab switch forces a repaint).
    backgroundColor: 'rgba(18,19,24,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 12,
  },
  frostBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  content: {
    paddingHorizontal: GLASS_PAD_H,
    paddingVertical: GLASS_PAD_V,
  },
});
