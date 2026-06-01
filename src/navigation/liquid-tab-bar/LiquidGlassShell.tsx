import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GLASS_PAD_H, GLASS_PAD_V, GLASS_RADIUS, GLASS_MERGE_SPACING } from './constants';
import {
  isLiquidGlassSupported,
  LiquidGlassContainerView,
  LiquidGlassView,
} from './nativeLiquidGlass';
import { GlassFallbackShell } from './GlassFallbackShell';

type Props = {
  children: React.ReactNode;
};

/**
 * Tab bar glass shell — native iOS 26 liquid glass when available, BlurView fallback otherwise.
 */
export function LiquidGlassShell({ children }: Props) {
  if (!isLiquidGlassSupported) {
    return <GlassFallbackShell>{children}</GlassFallbackShell>;
  }

  return (
    <View style={styles.shadowWrap}>
      <LiquidGlassContainerView style={styles.outer} spacing={GLASS_MERGE_SPACING}>
        <LiquidGlassView
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          effect="regular"
          colorScheme="dark"
          tintColor="rgba(255,255,255,0.05)"
        />
        <View style={styles.content}>{children}</View>
      </LiquidGlassContainerView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: GLASS_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
  },
  outer: {
    borderRadius: GLASS_RADIUS,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: GLASS_PAD_H,
    paddingVertical: GLASS_PAD_V,
  },
});
