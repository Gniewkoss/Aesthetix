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
import {
  DROP_HEIGHT,
  DROP_INSET_V,
  DROP_RADIUS,
  SELECTION_FALLBACK_BOTTOM,
  SELECTION_FALLBACK_MID,
  SELECTION_FALLBACK_TOP,
  SELECTION_GLASS_BORDER,
  SELECTION_GLASS_TINT,
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

/** Apple Music inner pill — lighter frosted layer (accent stays on icon/label only). */
function FallbackDrop({ dropStyle }: { dropStyle: DropStyle }) {
  return (
    <Animated.View style={[styles.dropSlot, dropStyle]} pointerEvents="none">
      <LinearGradient
        colors={[SELECTION_FALLBACK_TOP, SELECTION_FALLBACK_MID, SELECTION_FALLBACK_BOTTOM]}
        locations={[0, 0.42, 1]}
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
        effect="regular"
        interactive
        colorScheme="dark"
        tintColor={SELECTION_GLASS_TINT}
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
    borderColor: SELECTION_GLASS_BORDER,
  },
});
