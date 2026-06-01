import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { NAV_SCREEN_BACKGROUND } from './constants';
import { LiquidTabBar } from './liquid-tab-bar';

import { HomeScreen }            from '../screens/Dashboard/HomeScreen';
import { HistoryScreen }         from '../screens/History/HistoryScreen';
import { ProgressScreen }        from '../screens/Progress/ProgressScreen';
import { RecommendationsScreen } from '../screens/Recommendations/RecommendationsScreen';
import { ProfileScreen }         from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: undefined,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarBackground: () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />,
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: NAV_SCREEN_BACKGROUND }}
      screenOptions={TAB_BAR_SCREEN_OPTIONS}
    >
      <Tab.Screen name="Home"            component={HomeScreen} />
      <Tab.Screen name="History"         component={HistoryScreen} />
      <Tab.Screen name="Progress"        component={ProgressScreen} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} />
      <Tab.Screen name="Profile"         component={ProfileScreen} />
    </Tab.Navigator>
  );
}
