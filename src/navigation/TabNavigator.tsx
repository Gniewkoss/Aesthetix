import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../theme';
import {
  SPRING_UI,
  TAB_ICON_SCALE_ACTIVE,
  TAB_ICON_SCALE_INACTIVE,
} from '../motion';
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
  { name: 'Home',            icon: 'home-outline',       iconFocused: 'home',        label: 'Home'     },
  { name: 'History',         icon: 'time-outline',        iconFocused: 'time',        label: 'History'  },
  { name: 'Progress',        icon: 'trending-up-outline', iconFocused: 'trending-up', label: 'Progress' },
  { name: 'Recommendations', icon: 'flash-outline',       iconFocused: 'flash',       label: 'AI Coach' },
  { name: 'Profile',         icon: 'person-outline',      iconFocused: 'person',      label: 'Profile'  },
];


function AnimatedTabItem({
  tab,
  isFocused,
  onPress,
}: {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
}) {
  const iconScale = useSharedValue(isFocused ? TAB_ICON_SCALE_ACTIVE : TAB_ICON_SCALE_INACTIVE);

  React.useEffect(() => {
    iconScale.value = withSpring(
      isFocused ? TAB_ICON_SCALE_ACTIVE : TAB_ICON_SCALE_INACTIVE,
      SPRING_UI,
    );
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const activeColor = COLORS.accent;
  const inactiveColor = 'rgba(255,255,255,0.35)';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.70}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isFocused ? tab.iconFocused : tab.icon}
          size={24}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, { color: isFocused ? activeColor : inactiveColor }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const tab      = TABS[index];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedTabItem
              key={route.key}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
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
  tabBarWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.hairline,
    backgroundColor: COLORS.bg.primary,
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 49,
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    letterSpacing: 0.1,
  },
});
