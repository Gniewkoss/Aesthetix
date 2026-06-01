import type { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types';

export type LiquidTabDefinition = {
  name: keyof MainTabParamList;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  label: string;
};

export type TabMetrics = {
  tabX: number;
  contentX: number;
  contentW: number;
};

export type HighlightRect = {
  x: number;
  width: number;
};

export type LiquidTabBarProps = BottomTabBarProps;
