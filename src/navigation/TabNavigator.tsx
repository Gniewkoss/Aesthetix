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
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from '../theme';
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

const SPRING = { damping: 22, stiffness: 320, mass: 0.55 };
const TIMING = { duration: 200, easing: Easing.out(Easing.cubic) };

function AnimatedTabItem({
  tab,
  isFocused,
  onPress,
}: {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
}) {
  const iconScale    = useSharedValue(isFocused ? 1 : 0.85);
  const pillProgress = useSharedValue(isFocused ? 1 : 0);
  const dotProgress  = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    iconScale.value    = withSpring(isFocused ? 1 : 0.85, SPRING);
    pillProgress.value = withTiming(isFocused ? 1 : 0, TIMING);
    dotProgress.value  = withTiming(isFocused ? 1 : 0, TIMING);
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Pill background — cream tint, fades only (no scale, stays angular)
  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pillProgress.value, [0, 1], [0, 1]),
  }));

  // Top indicator — cream line expands from center
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(dotProgress.value, [0, 1], [0.15, 1]) }],
    opacity: interpolate(dotProgress.value, [0, 0.4, 1], [0, 1, 1]),
  }));

  const activeColor   = COLORS.cream;
  const inactiveColor = 'rgba(255,255,255,0.28)';

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.70}>
      {/* Top edge indicator pill */}
      <Animated.View style={[styles.topDot, dotStyle]} />

      {/* Pill background */}
      <Animated.View style={[styles.pillBg, pillStyle]} />

      {/* Icon */}
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isFocused ? tab.iconFocused : tab.icon}
          size={21}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>

      {/* Label */}
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
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(8,8,8,0.96)',
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    gap: 3,
    position: 'relative',
  },
  // Top edge indicator — cream hairline, sharp ends (brand geometry)
  topDot: {
    position: 'absolute',
    top: -10,
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.cream,
  },
  // Subtle pill bg — cream tint, angular corners matching brand sharpness
  pillBg: {
    position: 'absolute',
    top: 4,
    left: '12%',
    right: '12%',
    bottom: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.creamDim,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    letterSpacing: 0.2,
  },
});
