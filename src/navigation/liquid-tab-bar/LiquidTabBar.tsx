import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassShell } from './LiquidGlassShell';
import { LiquidDropIndicator } from './LiquidDropIndicator';
import { LiquidTabItem } from './LiquidTabItem';
import { LIQUID_TABS } from './tabs';
import {
  BAR_FLOAT_BOTTOM,
  BAR_HORIZONTAL_MARGIN,
  BAR_MIN_BOTTOM,
  BAR_ROW_HEIGHT,
  BAR_SAFE_INSET_REDUCTION,
} from './constants';
import { highlightFromMetrics } from './utils';
import type { LiquidTabBarProps, TabMetrics } from './types';

export function LiquidTabBar({ state, navigation }: LiquidTabBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const safeInsets = useSafeAreaInsets();
  const [metrics, setMetrics] = useState<Record<number, TabMetrics>>({});
  const [layoutPass, setLayoutPass] = useState(0);

  // Native liquid glass can render fully transparent until the next layout pass after first mount.
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setLayoutPass(1));
    return () => cancelAnimationFrame(id);
  }, []);

  const barWidth = screenWidth - BAR_HORIZONTAL_MARGIN * 2;
  const bottomOffset =
    safeInsets.bottom > 0
      ? Math.max(
          safeInsets.bottom - BAR_SAFE_INSET_REDUCTION + BAR_FLOAT_BOTTOM,
          6,
        )
      : BAR_MIN_BOTTOM;

  const onTabLayout = useCallback((index: number, layout: { x: number; width: number }) => {
    setMetrics((prev) => ({
      ...prev,
      [index]: {
        tabX: layout.x,
        contentX: prev[index]?.contentX ?? 0,
        contentW: prev[index]?.contentW ?? 0,
      },
    }));
  }, []);

  const onContentLayout = useCallback((index: number, layout: { x: number; width: number }) => {
    setMetrics((prev) => ({
      ...prev,
      [index]: {
        tabX: prev[index]?.tabX ?? 0,
        contentX: layout.x,
        contentW: layout.width,
      },
    }));
  }, []);

  const activeTarget = useMemo(
    () => highlightFromMetrics(metrics[state.index]),
    [metrics, state.index],
  );

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={[styles.barTrack, { width: barWidth }]}>
        <LiquidGlassShell key={`bar-${layoutPass}`}>
          <View style={styles.row}>
            <LiquidDropIndicator
              target={activeTarget}
              visible={activeTarget.width > 0}
              transitionKey={state.index}
            />

            {state.routes.map((route, index) => {
              const tab = LIQUID_TABS[index];
              if (!tab) return null;

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
                <LiquidTabItem
                  key={route.key}
                  tab={tab}
                  index={index}
                  isFocused={isFocused}
                  onPress={onPress}
                  onTabLayout={onTabLayout}
                  onContentLayout={onContentLayout}
                />
              );
            })}
          </View>
        </LiquidGlassShell>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  barTrack: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: BAR_ROW_HEIGHT,
  },
});
