import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getEmailAuthRedirectUrl } from './src/auth/authRedirect';
import {
  createSessionFromUrl,
  getInitialAuthUrl,
  subscribeToAuthLinks,
} from './src/auth/handleAuthCallback';
import { isSupabaseConfigured } from './src/api/supabase';
import { useAuthStore } from './src/store/useAuthStore';
import { useAnalysisStore } from './src/store/useAnalysisStore';
import { useProgressStore } from './src/store/useProgressStore';
import { COLORS } from './src/theme';

SplashScreen.preventAutoHideAsync();

const NAV_THEME = {
  dark: true,
  colors: {
    primary: COLORS.accent,
    background: COLORS.bg.primary,
    card: COLORS.bg.card,
    text: COLORS.text.primary,
    border: COLORS.border.hairline,
    notification: COLORS.red,
  },
};

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const syncFromSession = useAuthStore((s) => s.syncFromSession);
  const hydrateAnalysis = useAnalysisStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (__DEV__) {
      console.log('[Aesthetix] Add to Supabase → Auth → Redirect URLs:', getEmailAuthRedirectUrl());
    }

    const handleAuthUrl = async (url: string) => {
      try {
        const sessionCreated = await createSessionFromUrl(url);
        if (sessionCreated) await syncFromSession();
      } catch {
        // invalid or expired link — user can sign in manually
      }
    };

    void getInitialAuthUrl().then((url) => {
      if (url) void handleAuthUrl(url);
    });

    return subscribeToAuthLinks((url) => {
      void handleAuthUrl(url);
    });
  }, [syncFromSession]);

  useEffect(() => {
    if (!fontsLoaded) return;

    const BOOTSTRAP_TIMEOUT_MS = 8_000;

    const bootstrap = Promise.all([hydrateAuth(), hydrateAnalysis(), hydrateProgress()]);
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, BOOTSTRAP_TIMEOUT_MS);
    });

    Promise.race([bootstrap, timeout])
      .catch(() => {})
      .finally(() => {
        setBootstrapped(true);
        SplashScreen.hideAsync();
      });
  }, [fontsLoaded, hydrateAuth, hydrateAnalysis, hydrateProgress]);

  if (!fontsLoaded || !bootstrapped) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer theme={NAV_THEME}>
          <StatusBar style="light" backgroundColor="transparent" translucent />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
});
