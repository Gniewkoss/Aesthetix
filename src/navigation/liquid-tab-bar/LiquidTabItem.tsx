import React, { memo, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { C, T } from '../../theme/obsidian';
import { TAB_ICON_SCALE_ACTIVE, TAB_ICON_SCALE_INACTIVE } from '../../motion';
import { BAR_ROW_HEIGHT, SPRING_TAB_ICON } from './constants';
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
    color: interpolateColor(focus.value, [0, 1], [C.text, C.volt]),
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
      <Animated.View
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
            color={isFocused ? C.volt : C.text}
          />
        </Animated.View>
        <Animated.Text
          style={[styles.label, labelStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export const LiquidTabItem = memo(LiquidTabItemComponent);

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: BAR_ROW_HEIGHT,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  label: {
    ...T.caption,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
