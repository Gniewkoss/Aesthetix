import type { LiquidTabDefinition } from './types';

export const LIQUID_TABS: LiquidTabDefinition[] = [
  { name: 'Home',            icon: 'home-outline',        iconFocused: 'home',        label: 'Home' },
  { name: 'History',         icon: 'time-outline',        iconFocused: 'time',        label: 'History' },
  { name: 'Progress',        icon: 'trending-up-outline', iconFocused: 'trending-up', label: 'Progress' },
  { name: 'Recommendations', icon: 'flash-outline',       iconFocused: 'flash',       label: 'AI Coach' },
  { name: 'Profile',         icon: 'person-outline',      iconFocused: 'person',      label: 'Profile' },
];
