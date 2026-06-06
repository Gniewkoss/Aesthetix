import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import { View } from 'react-native';
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
import { navigationRef } from './src/navigation/navigationRef';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initErrorTracking } from './src/lib/errorTracking';
import { getEmailAuthRedirectUrl } from './src/auth/authRedirect';
import {
  createSessionFromUrl,
  getInitialAuthUrl,
  subscribeToAuthLinks,
} from './src/auth/handleAuthCallback';
import { getValidatedSession } from './src/auth/session';
import { isSupabaseConfigured } from './src/api/supabase';
import { useAuthStore } from './src/store/useAuthStore';
import { useAnalysisStore } from './src/store/useAnalysisStore';
import { useProgressStore } from './src/store/useProgressStore';
import { useConsentStore } from './src/store/useConsentStore';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { initPurchases } from './src/subscription/purchases';
import { useSessionTimeout } from './src/hooks/useSessionTimeout';
import { touchSessionActivity } from './src/lib/sessionTimeout';
import { isExpoGo } from './src/lib/runtime';

void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Last-resort: never leave reviewers stuck on the native splash. */
const SPLASH_MAX_MS = 10_000;
const FONT_LOAD_MAX_MS = 5_000;
const BOOTSTRAP_MAX_MS = 6_000;

function hideSplash(): void {
  void SplashScreen.hideAsync().catch(() => {});
}

function AppShell() {
  const { navTheme, isDark } = useAppTheme();
  useSessionTimeout();
  usePushNotifications();
  const shellBg = navTheme.colors.background;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: shellBg }}>
      <View style={{ flex: 1, backgroundColor: shellBg }} className={isDark ? 'dark flex-1' : 'flex-1'}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: shellBg }}>
          <NavigationContainer
            ref={navigationRef}
            theme={navTheme}
            onStateChange={() => touchSessionActivity()}
          >
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={shellBg} />
            <RootNavigator />
          </NavigationContainer>
          <PortalHost />
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}

function App() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [fontsTimedOut, setFontsTimedOut] = useState(false);

  useEffect(() => {
    void initErrorTracking();
    void initPurchases();
  }, []);

  // Absolute ceiling — hides splash even if fonts/bootstrap hang (App Review freeze).
  useEffect(() => {
    const kill = setTimeout(() => {
      hideSplash();
      setFontsTimedOut(true);
      setBootstrapped(true);
    }, SPLASH_MAX_MS);
    return () => clearTimeout(kill);
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const fontsReady = fontsLoaded || fontError != null || fontsTimedOut;

  useEffect(() => {
    if (fontsLoaded || fontError != null) return;
    const t = setTimeout(() => setFontsTimedOut(true), FONT_LOAD_MAX_MS);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError]);

  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const syncFromSession = useAuthStore((s) => s.syncFromSession);
  const hydrateAnalysis = useAnalysisStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateConsent = useConsentStore((s) => s.hydrate);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getValidatedSession();
  }, []);

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
    if (!fontsReady) return;

    const bootstrap = (async () => {
      await hydrateAuth();
      await Promise.all([hydrateAnalysis(), hydrateProgress(), hydrateConsent()]);
    })();
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, BOOTSTRAP_MAX_MS);
    });

    Promise.race([bootstrap, timeout])
      .catch(() => {})
      .finally(() => {
        setBootstrapped(true);
        hideSplash();
      });
  }, [fontsReady, hydrateAuth, hydrateAnalysis, hydrateProgress, hydrateConsent]);

  if (!fontsReady || !bootstrapped) return null;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

let RootApp: React.ComponentType = App;
if (!isExpoGo && process.env.EXPO_PUBLIC_SENTRY_DSN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RootApp = require('@sentry/react-native').wrap(App);
  } catch {
    // SDK not linked yet — prebuild required
  }
}

export default RootApp;
