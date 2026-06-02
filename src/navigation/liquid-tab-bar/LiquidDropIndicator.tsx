import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import {
  DROP_HEIGHT,
  DROP_INSET_V,
  DROP_RADIUS,
  SELECTION_FALLBACK_BOTTOM,
  SELECTION_FALLBACK_MID,
  SELECTION_FALLBACK_TOP,
  SELECTION_GLASS_TINT,
  SPRING_DROP_GLIDE,
  DROP_SQUASH_MS,
  SPRING_DROP_MORPH,
  SPRING_DROP_OPACITY_SETTLE,
  DROP_JIGGLE_ROTATE_DIP_DEG,
  DROP_JIGGLE_ROTATE_PEAK_DEG,
  DROP_JIGGLE_ROTATE_TAIL_DEG,
  DROP_JIGGLE_SCALE_X_DIP,
  DROP_JIGGLE_SCALE_X_PEAK,
  DROP_JIGGLE_SCALE_X_TAIL,
  DROP_JIGGLE_SCALE_Y_DIP,
  DROP_JIGGLE_SCALE_Y_PEAK,
  DROP_JIGGLE_SCALE_Y_TAIL,
  DROP_SQUASH_SCALE_X,
  DROP_SQUASH_SCALE_Y,
  SPRING_DROP_JIGGLE,
  SPRING_DROP_JIGGLE_END,
  SPRING_DROP_REBOUND_X,
  SPRING_DROP_REBOUND_Y,
} from './constants';
import { capsuleClip } from './glassCapsule';
import { isLiquidGlassSupported, LiquidGlassView } from './nativeLiquidGlass';
import type { HighlightRect } from './types';

type Props = {
  target: HighlightRect;
  visible: boolean;
  transitionKey: number;
};

type DropStyle = AnimatedStyle<ViewStyle>;

function FallbackDrop({ dropStyle }: { dropStyle: DropStyle }) {
  return (
    <Animated.View style={[styles.dropSlot, dropStyle]} pointerEvents="none">
      <LinearGradient
        colors={[SELECTION_FALLBACK_TOP, SELECTION_FALLBACK_MID, SELECTION_FALLBACK_BOTTOM]}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.capsule, capsuleClip(DROP_RADIUS), styles.dropFallback]}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'transparent']}
        locations={[0, 0.5]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFillObject, capsuleClip(DROP_RADIUS)]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

function NativeDrop({ dropStyle }: { dropStyle: DropStyle }) {
  return (
    <Animated.View style={[styles.dropSlot, dropStyle]} pointerEvents="none">
      <LiquidGlassView
        style={[styles.capsule, capsuleClip(DROP_RADIUS)]}
        effect="regular"
        interactive
        colorScheme="dark"
        tintColor={SELECTION_GLASS_TINT}
      />
    </Animated.View>
  );
}

/** Morphing liquid-drop — fast glide + stretch/squash “droplet” pulse on tab change. */
export function LiquidDropIndicator({ target, visible, transitionKey }: Props) {
  const x = useSharedValue(target.x);
  const w = useSharedValue(target.width);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const prevKey = useRef(transitionKey);

  useEffect(() => {
    if (target.width <= 0) return;

    x.value = withSpring(target.x, SPRING_DROP_GLIDE);
    w.value = withSpring(target.width, SPRING_DROP_MORPH);

    if (prevKey.current !== transitionKey) {
      prevKey.current = transitionKey;

      const squashTiming = {
        duration: DROP_SQUASH_MS,
        easing: Easing.bezier(0.33, 0, 0.2, 1),
      };

      scaleX.value = withSequence(
        withTiming(DROP_SQUASH_SCALE_X, squashTiming),
        withSpring(1, SPRING_DROP_REBOUND_X),
        withSpring(DROP_JIGGLE_SCALE_X_DIP, SPRING_DROP_JIGGLE),
        withSpring(DROP_JIGGLE_SCALE_X_PEAK, SPRING_DROP_JIGGLE),
        withSpring(DROP_JIGGLE_SCALE_X_TAIL, SPRING_DROP_JIGGLE),
        withSpring(1, SPRING_DROP_JIGGLE_END),
      );
      scaleY.value = withSequence(
        withTiming(DROP_SQUASH_SCALE_Y, squashTiming),
        withSpring(1, SPRING_DROP_REBOUND_Y),
        withSpring(DROP_JIGGLE_SCALE_Y_PEAK, SPRING_DROP_JIGGLE),
        withSpring(DROP_JIGGLE_SCALE_Y_DIP, SPRING_DROP_JIGGLE),
        withSpring(DROP_JIGGLE_SCALE_Y_TAIL, SPRING_DROP_JIGGLE),
        withSpring(1, SPRING_DROP_JIGGLE_END),
      );
      rotate.value = withSequence(
        withSpring(DROP_JIGGLE_ROTATE_PEAK_DEG, SPRING_DROP_JIGGLE),
        withSpring(DROP_JIGGLE_ROTATE_DIP_DEG, SPRING_DROP_JIGGLE),
        withSpring(DROP_JIGGLE_ROTATE_TAIL_DEG, SPRING_DROP_JIGGLE),
        withSpring(0, SPRING_DROP_JIGGLE_END),
      );
      opacity.value = withSequence(
        withTiming(0.8, { duration: DROP_SQUASH_MS, easing: Easing.inOut(Easing.quad) }),
        withSpring(1, SPRING_DROP_OPACITY_SETTLE),
      );
    }
  }, [target.x, target.width, transitionKey, x, w, scaleX, scaleY, rotate, opacity]);

  const dropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { rotate: `${rotate.value}deg` },
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
    borderWidth: 0,
  },
});
