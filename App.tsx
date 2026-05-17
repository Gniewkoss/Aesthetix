import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/useAuthStore';
import { useAnalysisStore } from './src/store/useAnalysisStore';
import { useProgressStore } from './src/store/useProgressStore';

SplashScreen.preventAutoHideAsync();

const NAV_THEME = {
  dark: true,
  colors: {
    primary: '#3B82F6',
    background: '#080808',
    card: '#0F0F0F',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.07)',
    notification: '#EF4444',
  },
};

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  const [fontsLoaded] = useFonts({
    Oswald_600SemiBold,
    Oswald_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateAnalysis = useAnalysisStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);

  useEffect(() => {
    if (!fontsLoaded) return;

    Promise.all([hydrateAuth(), hydrateAnalysis(), hydrateProgress()])
      .catch(() => {})
      .finally(() => {
        setBootstrapped(true);
        SplashScreen.hideAsync();
      });
  }, [fontsLoaded]);

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
    backgroundColor: '#080808',
  },
});
