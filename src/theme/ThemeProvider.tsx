import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { useSettingsStore, type AppearanceMode } from '../store/useSettingsStore';
import { applyThemeScheme, buildNavTheme, type ThemeScheme } from './index';
import type { Theme } from '@react-navigation/native';

type ThemeContextValue = {
  scheme: ThemeScheme;
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
  isDark: boolean;
  navTheme: Theme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(appearance: AppearanceMode, system: ThemeScheme | null | undefined): ThemeScheme {
  if (appearance === 'system') return system === 'light' ? 'light' : 'dark';
  return appearance;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appearance = useSettingsStore((s) => s.settings.appearance);
  const setAppearanceSetting = useSettingsStore((s) => s.setAppearance);
  const systemScheme = useColorScheme();
  const [, setTick] = useState(0);

  const scheme = resolveScheme(appearance, systemScheme);
  const isDark = scheme === 'dark';

  const apply = useCallback((next: ThemeScheme) => {
    applyThemeScheme(next);
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    apply(scheme);
  }, [scheme, apply]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      if (appearance === 'system') apply(resolveScheme('system', Appearance.getColorScheme()));
    });
    return () => sub.remove();
  }, [appearance, apply]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      appearance,
      setAppearance: setAppearanceSetting,
      isDark,
      navTheme: buildNavTheme(scheme),
    }),
    [scheme, appearance, setAppearanceSetting, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
