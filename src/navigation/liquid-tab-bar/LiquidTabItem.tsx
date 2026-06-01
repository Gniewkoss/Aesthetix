import React, { memo, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { C, T } from '../../theme/obsidian';
import { TAB_ICON_SCALE_ACTIVE, TAB_ICON_SCALE_INACTIVE } from '../../motion';
import { SPRING_TAB_ICON } from './constants';
import { triggerTabHaptic } from './haptics';
import type { LiquidTabDefinition } from './types';

type Props = {
  tab: LiquidTabDefinition;
  index: number;
  isFocused: boolean;
  onPress: () => void;
  onTabLayout: (index: number, layout: { x: number; width: number }) => void;
  onContentLayout: (index: number, layout: { x: number; width: number }) => void;
};

function LiquidTabItemComponent({
  tab,
  index,
  isFocused,
  onPress,
  onTabLayout,
  onContentLayout,
}: Props) {
  const focus = useSharedValue(isFocused ? 1 : 0);
  const scale = useSharedValue(isFocused ? TAB_ICON_SCALE_ACTIVE : TAB_ICON_SCALE_INACTIVE);

  useEffect(() => {
    focus.value = withSpring(isFocused ? 1 : 0, SPRING_TAB_ICON);
    scale.value = withSpring(
      isFocused ? TAB_ICON_SCALE_ACTIVE : TAB_ICON_SCALE_INACTIVE,
      SPRING_TAB_ICON,
    );
  }, [isFocused, focus, scale]);

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(focus.value, [0, 1], [C.text3, C.volt]),
    opacity: 0.72 + focus.value * 0.28,
  }));

  const handlePress = () => {
    if (!isFocused) triggerTabHaptic();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.item}
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        onTabLayout(index, { x, width });
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      <View
        style={styles.content}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          onContentLayout(index, { x, width });
        }}
      >
        <Animated.View style={iconWrapStyle}>
          <Ionicons
            name={isFocused ? tab.iconFocused : tab.icon}
            size={22}
            color={isFocused ? C.volt : C.text3}
          />
        </Animated.View>
        <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
          {tab.label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

export const LiquidTabItem = memo(LiquidTabItemComponent);

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 52,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    gap: 3,
  },
  label: {
    ...T.caption,
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
