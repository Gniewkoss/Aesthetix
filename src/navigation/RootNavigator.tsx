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
import { PremiumScreen } from '../screens/Premium/PremiumScreen';
import { AchievementsScreen } from '../screens/Profile/AchievementsScreen';
import { NotificationsScreen } from '../screens/Profile/NotificationsScreen';
import { PrivacyDataScreen } from '../screens/Profile/PrivacyDataScreen';
import { HelpSupportScreen } from '../screens/Profile/HelpSupportScreen';
import { ManageSubscriptionScreen } from '../screens/Profile/ManageSubscriptionScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'fade_from_bottom',
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
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="MuscleDetail" component={MuscleDetailScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Premium" component={PremiumScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="PrivacyData" component={PrivacyDataScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} options={{ animation: 'slide_from_right' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
