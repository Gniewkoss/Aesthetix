import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { C, T, R, S } from '../theme/obsidian';
import { SPRING_UI, TAB_ICON_SCALE_ACTIVE, TAB_ICON_SCALE_INACTIVE } from '../motion';
import { MainTabParamList } from './types';

import { HomeScreen }            from '../screens/Dashboard/HomeScreen';
import { HistoryScreen }         from '../screens/History/HistoryScreen';
import { ProgressScreen }        from '../screens/Progress/ProgressScreen';
import { RecommendationsScreen } from '../screens/Recommendations/RecommendationsScreen';
import { ProfileScreen }         from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabItem = {
  name: keyof MainTabParamList;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TABS: TabItem[] = [
  { name: 'Home',            icon: 'home-outline',        iconFocused: 'home',        label: 'Home' },
  { name: 'History',         icon: 'time-outline',        iconFocused: 'time',        label: 'History' },
  { name: 'Progress',        icon: 'trending-up-outline', iconFocused: 'trending-up', label: 'Progress' },
  { name: 'Recommendations', icon: 'flash-outline',       iconFocused: 'flash',       label: 'AI Coach' },
  { name: 'Profile',         icon: 'person-outline',      iconFocused: 'person',      label: 'Profile' },
];

const PAD = 6;

function TabItemView({ tab, isFocused, onPress }: { tab: TabItem; isFocused: boolean; onPress: () => void }) {
  const scale = useSharedValue(isFocused ? TAB_ICON_SCALE_ACTIVE : TAB_ICON_SCALE_INACTIVE);
  useEffect(() => {
    scale.value = withSpring(isFocused ? TAB_ICON_SCALE_ACTIVE : TAB_ICON_SCALE_INACTIVE, SPRING_UI);
  }, [isFocused]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = isFocused ? C.volt : C.text3;

  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={isFocused ? tab.iconFocused : tab.icon} size={23} color={color} />
      </Animated.View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>{tab.label}</Text>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [innerW, setInnerW] = useState(0);
  const segW = innerW > 0 ? innerW / TABS.length : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(state.index * segW, SPRING_UI);
  }, [state.index, segW]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: segW,
  }));

  const onLayout = (e: LayoutChangeEvent) => setInnerW(e.nativeEvent.layout.width);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <View style={styles.inner} onLayout={onLayout}>
          {segW > 0 && <Animated.View style={[styles.highlight, highlightStyle]} pointerEvents="none" />}
          {state.routes.map((route: any, index: number) => {
            const tab = TABS[index];
            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return <TabItemView key={route.key} tab={tab} isFocused={isFocused} onPress={onPress} />;
          })}
        </View>
      </View>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: C.canvas }}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"            component={HomeScreen} />
      <Tab.Screen name="History"         component={HistoryScreen} />
      <Tab.Screen name="Progress"        component={ProgressScreen} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} />
      <Tab.Screen name="Profile"         component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Floating: scenes render full-height behind it; screens pad ~112 to clear.
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  pill: {
    backgroundColor: C.surface3,
    borderRadius: R['2xl'],
    borderWidth: 1,
    borderColor: C.borderMd,
    paddingHorizontal: PAD,
    paddingVertical: PAD,
    // soft lift
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  inner: {
    flexDirection: 'row',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: C.voltDim,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.voltBorder,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
    minHeight: 52,
  },
  label: {
    ...T.caption,
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
