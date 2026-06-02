import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import { C } from '../../theme/obsidian';
import {
  DROP_HEIGHT,
  DROP_INSET_V,
  DROP_RADIUS,
  SPRING_DROP_GLIDE,
  SPRING_DROP_MORPH,
} from './constants';
import { isLiquidGlassSupported, LiquidGlassView } from './nativeLiquidGlass';
import type { HighlightRect } from './types';

type Props = {
  target: HighlightRect;
  visible: boolean;
  transitionKey: number;
};

type DropStyle = AnimatedStyle<ViewStyle>;

/** Apple-style tinted inner pill — volt instead of system pink */
const VOLT_TINT = 'rgba(199,249,64,0.24)';

function FallbackDrop({ dropStyle }: { dropStyle: DropStyle }) {
  return (
    <Animated.View style={[styles.dropSlot, dropStyle]} pointerEvents="none">
      <LinearGradient
        colors={[VOLT_TINT, 'rgba(199,249,64,0.14)', 'rgba(255,255,255,0.05)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.capsule, styles.dropFallback]}
      />
    </Animated.View>
  );
}

function NativeDrop({ dropStyle }: { dropStyle: DropStyle }) {
  return (
    <Animated.View style={[styles.dropSlot, dropStyle]} pointerEvents="none">
      <LiquidGlassView
        style={styles.capsule}
        effect="clear"
        interactive
        colorScheme="dark"
        tintColor={VOLT_TINT}
      />
    </Animated.View>
  );
}

export function LiquidDropIndicator({ target, visible, transitionKey }: Props) {
  const x = useSharedValue(target.x);
  const w = useSharedValue(target.width);

  useEffect(() => {
    if (target.width <= 0) return;
    x.value = withSpring(target.x, SPRING_DROP_GLIDE);
    w.value = withSpring(target.width, SPRING_DROP_MORPH);
  }, [target.x, target.width, transitionKey, x, w]);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: w.value,
  }));

  if (!visible) return null;

  const Drop = isLiquidGlassSupported ? NativeDrop : FallbackDrop;
  return <Drop dropStyle={dropStyle} />;
}

const styles = StyleSheet.create({
  dropSlot: {
    position: 'absolute',
    top: DROP_INSET_V,
    height: DROP_HEIGHT,
  },
  capsule: {
    flex: 1,
    height: DROP_HEIGHT,
    borderRadius: DROP_RADIUS,
    overflow: 'hidden',
  },
  dropFallback: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(199,249,64,0.22)',
    backgroundColor: C.voltDim,
  },
});
