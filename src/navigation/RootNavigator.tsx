import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/useAuthStore';

import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';
import { AuthScreen } from '../screens/Auth/AuthScreen';
import { UploadScreen } from '../screens/Upload/UploadScreen';
import { AnalysisLoadingScreen } from '../screens/Analysis/AnalysisLoadingScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { MuscleDetailScreen } from '../screens/MuscleDetail/MuscleDetailScreen';
import { AchievementsScreen } from '../screens/Profile/AchievementsScreen';
import { NotificationsScreen } from '../screens/Profile/NotificationsScreen';
import { PrivacyDataScreen } from '../screens/Profile/PrivacyDataScreen';
import { HelpSupportScreen } from '../screens/Profile/HelpSupportScreen';
import { ManageSubscriptionScreen } from '../screens/Profile/ManageSubscriptionScreen';
import { AppearanceScreen } from '../screens/Profile/AppearanceScreen';
import { TabNavigator } from './TabNavigator';
import { NAV_CONTENT_STYLE } from './constants';
import { useAppTheme } from '../theme/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  const { scheme } = useAppTheme();

  return (
    <Stack.Navigator
      key={scheme}
      screenOptions={{
        headerShown: false,
        contentStyle: NAV_CONTENT_STYLE,
        animation: 'fade_from_bottom',
        fullScreenGestureEnabled: true,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'fade' }} />
      ) : !onboardingCompleted ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Upload" component={UploadScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
          <Stack.Screen
            name="AnalysisLoading"
            component={AnalysisLoadingScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
              fullScreenGestureEnabled: false,
            }}
          />
          <Stack.Screen name="MuscleDetail" component={MuscleDetailScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="PrivacyData" component={PrivacyDataScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="ManageSubscription"
            component={ManageSubscriptionScreen}
            options={{
              animation: 'slide_from_right',
              gestureEnabled: false,
              fullScreenGestureEnabled: false,
            }}
          />
          <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ animation: 'slide_from_right' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
