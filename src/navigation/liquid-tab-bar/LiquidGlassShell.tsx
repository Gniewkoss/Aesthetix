import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BAR_GLASS_TINT,
  GLASS_MERGE_SPACING,
  GLASS_PAD_H,
  GLASS_PAD_V,
  GLASS_RADIUS,
} from './constants';
import { GlassCapsuleRim } from './GlassCapsuleRim';
import { capsuleClip } from './glassCapsule';
import {
  isLiquidGlassSupported,
  LiquidGlassContainerView,
  LiquidGlassView,
} from './nativeLiquidGlass';
import { GlassFallbackShell } from './GlassFallbackShell';

type Props = {
  children: React.ReactNode;
};

export function LiquidGlassShell({ children }: Props) {
  if (!isLiquidGlassSupported) {
    return <GlassFallbackShell>{children}</GlassFallbackShell>;
  }

  const clip = capsuleClip(GLASS_RADIUS);

  return (
    <View style={[styles.shadowWrap, clip]}>
      <LiquidGlassContainerView style={[styles.container, clip]} spacing={GLASS_MERGE_SPACING}>
        <LiquidGlassView
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, clip]}
          effect="clear"
          colorScheme="dark"
          tintColor={BAR_GLASS_TINT}
        />
        <GlassCapsuleRim radius={GLASS_RADIUS} />
        <View style={styles.content}>{children}</View>
      </LiquidGlassContainerView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  container: {
    position: 'relative',
  },
  content: {
    paddingHorizontal: GLASS_PAD_H,
    paddingVertical: GLASS_PAD_V,
  },
});
