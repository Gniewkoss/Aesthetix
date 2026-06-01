import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import {
  DROP_RADIUS,
  SPRING_DROP_GLIDE,
  SPRING_DROP_MORPH,
  SPRING_DROP_SETTLE,
  SPRING_DROP_SQUASH,
} from './constants';
import { isLiquidGlassSupported, LiquidGlassView } from './nativeLiquidGlass';
import type { HighlightRect } from './types';

type Props = {
  target: HighlightRect;
  visible: boolean;
  /** Bumps on each tab change to re-trigger liquid squash */
  transitionKey: number;
};

type DropStyle = AnimatedStyle<ViewStyle>;

function FallbackDrop({ dropStyle }: { dropStyle: DropStyle }) {
  return (
    <Animated.View style={[styles.drop, styles.dropFallback, dropStyle]} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.34)',
          'rgba(255,255,255,0.14)',
          'rgba(255,255,255,0.05)',
        ]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

function NativeDrop({ dropStyle }: { dropStyle: DropStyle }) {
  return (
    <Animated.View style={[styles.drop, dropStyle]} pointerEvents="none">
      <LiquidGlassView
        style={StyleSheet.absoluteFillObject}
        effect="clear"
        colorScheme="dark"
        tintColor="rgba(255,255,255,0.12)"
      />
    </Animated.View>
  );
}

/**
 * Morphing liquid-drop indicator — glides between tabs with subtle stretch/squash.
 */
export function LiquidDropIndicator({ target, visible, transitionKey }: Props) {
  const x = useSharedValue(target.x);
  const w = useSharedValue(target.width);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  const prevKey = useRef(transitionKey);

  useEffect(() => {
    if (target.width <= 0) return;

    x.value = withSpring(target.x, SPRING_DROP_GLIDE);
    w.value = withSpring(target.width, SPRING_DROP_MORPH);

    if (prevKey.current !== transitionKey) {
      prevKey.current = transitionKey;
      scaleX.value = withSequence(
        withSpring(1.07, SPRING_DROP_SQUASH),
        withSpring(1, SPRING_DROP_SETTLE),
      );
      scaleY.value = withSequence(
        withSpring(0.93, SPRING_DROP_SQUASH),
        withSpring(1, SPRING_DROP_SETTLE),
      );
    }
  }, [target.x, target.width, transitionKey, x, w, scaleX, scaleY]);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
    width: w.value,
  }));

  if (!visible) return null;

  const Drop = isLiquidGlassSupported ? NativeDrop : FallbackDrop;
  return <Drop dropStyle={dropStyle} />;
}

const styles = StyleSheet.create({
  drop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: DROP_RADIUS,
    overflow: 'hidden',
  },
  dropFallback: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
