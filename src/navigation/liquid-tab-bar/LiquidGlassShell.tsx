import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GLASS_MERGE_SPACING,
  GLASS_PAD_H,
  GLASS_PAD_V,
  GLASS_RADIUS,
} from './constants';
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

  return (
    <View style={styles.shadowWrap}>
      <LiquidGlassContainerView style={styles.container} spacing={GLASS_MERGE_SPACING}>
        <LiquidGlassView
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          effect="regular"
          colorScheme="dark"
          tintColor="rgba(255,255,255,0.04)"
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
  },
  container: {
    borderRadius: GLASS_RADIUS,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  content: {
    paddingHorizontal: GLASS_PAD_H,
    paddingVertical: GLASS_PAD_V,
  },
});
