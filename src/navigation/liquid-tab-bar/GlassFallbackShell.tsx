import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GLASS_PAD_H, GLASS_PAD_V, GLASS_RADIUS } from './constants';

type Props = {
  children: React.ReactNode;
};

/** Frosted glass fallback when native iOS 26 liquid glass is unavailable. */
export function GlassFallbackShell({ children }: Props) {
  const blurTint = Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark';

  return (
    <View style={styles.outer}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 82 : 76}
        tint={blurTint as 'dark'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.frostBase} pointerEvents="none" />

      <LinearGradient
        colors={[
          'rgba(255,255,255,0.48)',
          'rgba(255,255,255,0.16)',
          'rgba(255,255,255,0.04)',
          'transparent',
        ]}
        locations={[0, 0.1, 0.26, 0.52]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.11)', 'transparent', 'rgba(255,255,255,0.08)']}
        start={{ x: 0.08, y: 0.2 }}
        end={{ x: 0.92, y: 0.75 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.20)']}
        locations={[0.6, 1]}
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
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 14,
  },
  frostBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRim: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.55)',
    opacity: 0.35,
  },
  content: {
    paddingHorizontal: GLASS_PAD_H,
    paddingVertical: GLASS_PAD_V,
  },
});
