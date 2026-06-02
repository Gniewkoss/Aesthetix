import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BAR_GLASS_BORDER,
  GLASS_PAD_H,
  GLASS_PAD_V,
  GLASS_RADIUS,
} from './constants';

type Props = {
  children: React.ReactNode;
};

/** Frosted glass fallback — Apple Music outer bar */
export function GlassFallbackShell({ children }: Props) {
  const blurTint = Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark';

  return (
    <View style={styles.outer}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 88 : 80}
        tint={blurTint as 'dark'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.frostBase} pointerEvents="none" />

      <LinearGradient
        colors={[
          'rgba(255,255,255,0.14)',
          'rgba(255,255,255,0.05)',
          'rgba(255,255,255,0.02)',
        ]}
        locations={[0, 0.25, 0.6]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.18)']}
        locations={[0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.topRim} pointerEvents="none" />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: GLASS_RADIUS,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BAR_GLASS_BORDER,
    backgroundColor: 'rgba(28,28,30,0.48)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 12,
  },
  frostBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  topRim: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.45)',
    opacity: 0.42,
  },
  content: {
    paddingHorizontal: GLASS_PAD_H,
    paddingVertical: GLASS_PAD_V,
  },
});
