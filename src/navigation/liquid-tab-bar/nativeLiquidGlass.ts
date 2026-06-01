import React from 'react';
import { NativeModules, Platform, View, type ViewProps } from 'react-native';
import type { LiquidGlassViewProps } from '@callstack/liquid-glass';

type LiquidGlassViewComponent = React.ComponentType<LiquidGlassViewProps>;
type LiquidGlassContainerComponent = React.ComponentType<ViewProps & { spacing?: number }>;

let isLiquidGlassSupported = false;
let LiquidGlassView: LiquidGlassViewComponent = View as LiquidGlassViewComponent;
let LiquidGlassContainerView: LiquidGlassContainerComponent = View as LiquidGlassContainerComponent;

function hasNativeModule(): boolean {
  if (Platform.OS !== 'ios') return false;
  return NativeModules.NativeLiquidGlassModule != null;
}

if (hasNativeModule()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@callstack/liquid-glass') as typeof import('@callstack/liquid-glass');
    isLiquidGlassSupported = mod.isLiquidGlassSupported;
    LiquidGlassView = mod.LiquidGlassView;
    LiquidGlassContainerView = mod.LiquidGlassContainerView;
  } catch {
    isLiquidGlassSupported = false;
  }
}

export { isLiquidGlassSupported, LiquidGlassView, LiquidGlassContainerView };
