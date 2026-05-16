import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';
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
  { name: 'Home', icon: 'home-outline', iconFocused: 'home', label: 'Home' },
  { name: 'History', icon: 'time-outline', iconFocused: 'time', label: 'History' },
  { name: 'Progress', icon: 'trending-up-outline', iconFocused: 'trending-up', label: 'Progress' },
  { name: 'Recommendations', icon: 'flash-outline', iconFocused: 'flash', label: 'AI Coach' },
  { name: 'Profile', icon: 'person-outline', iconFocused: 'person', label: 'Profile' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const tab = TABS[index];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
              {isFocused && <View style={styles.activePill} />}
              <Ionicons
                name={isFocused ? tab.iconFocused : tab.icon}
                size={22}
                color={isFocused ? COLORS.cyan : COLORS.text.muted}
              />
              <Text style={[styles.tabLabel, { color: isFocused ? COLORS.cyan : COLORS.text.muted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
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
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(0,0,0,0.8)',
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: -2,
    width: 32,
    height: 3,
    backgroundColor: COLORS.cyan,
    borderRadius: RADIUS.full,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: FONTS.weights.semibold,
    marginTop: 3,
  },
});
