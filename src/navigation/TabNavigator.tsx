import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from '../theme';
import { MainTabParamList } from './types';

import { HomeScreen } from '../screens/Dashboard/HomeScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';
import { ProgressScreen } from '../screens/Progress/ProgressScreen';
import { RecommendationsScreen } from '../screens/Recommendations/RecommendationsScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabItem = {
  name: keyof MainTabParamList;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TABS: TabItem[] = [
  { name: 'Home',            icon: 'home-outline',         iconFocused: 'home',         label: 'Home'     },
  { name: 'History',         icon: 'time-outline',          iconFocused: 'time',         label: 'History'  },
  { name: 'Progress',        icon: 'trending-up-outline',   iconFocused: 'trending-up',  label: 'Progress' },
  { name: 'Recommendations', icon: 'flash-outline',         iconFocused: 'flash',        label: 'AI Coach' },
  { name: 'Profile',         icon: 'person-outline',        iconFocused: 'person',       label: 'Profile'  },
];

const SPRING = { damping: 16, stiffness: 320, mass: 0.7 };

function AnimatedTabItem({
  tab,
  isFocused,
  onPress,
}: {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
}) {
  const iconScale = useSharedValue(isFocused ? 1 : 0.88);
  const dotWidth = useSharedValue(isFocused ? 16 : 0);

  React.useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1 : 0.88, SPRING);
    dotWidth.value = withSpring(isFocused ? 16 : 0, SPRING);
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    opacity: dotWidth.value / 16,
  }));

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.65}>
      <Animated.View style={[styles.dotWrap, dotStyle]} />
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isFocused ? tab.iconFocused : tab.icon}
          size={21}
          color={isFocused ? COLORS.accent : COLORS.text.disabled}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, { color: isFocused ? COLORS.accent : COLORS.text.disabled }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const tab = TABS[index];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <AnimatedTabItem key={route.key} tab={tab} isFocused={isFocused} onPress={onPress} />
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(8,8,8,0.92)',
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    position: 'relative',
    gap: 3,
  },
  dotWrap: {
    position: 'absolute',
    top: -1,
    height: 2,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    letterSpacing: 0.2,
  },
});
