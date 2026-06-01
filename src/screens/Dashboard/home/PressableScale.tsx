import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPRING_PRESS, SCALE_PRESS_IN, SCALE_PRESS_OUT } from '../../../motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Scale target on press-in (cards use a gentler value than buttons). */
  scaleTo?: number;
  haptics?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
  disabled?: boolean;
  hitSlop?: number;
}

/** Shared press affordance: spring scale + optional light haptic. */
export function PressableScale({
  children,
  onPress,
  scaleTo = SCALE_PRESS_IN,
  haptics = true,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  disabled = false,
  hitSlop,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(scaleTo, SPRING_PRESS); }}
      onPressOut={() => { scale.value = withSpring(SCALE_PRESS_OUT, SPRING_PRESS); }}
      onPress={() => {
        if (disabled) return;
        if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={[animStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
