import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from './types';
import type { UpgradeReason } from '../subscription/upgradeReasons';
import type { SubscriptionPlanId } from '../subscription/subscription';

export type UpgradePaywallParams = RootStackParamList['UpgradePaywall'];

/** Opens the marketing paywall modal (root stack). Works from tabs or stack navigators. */
export function navigateToUpgrade(
  navigation: { navigate: (...args: never[]) => void },
  params?: {
    reason?: UpgradeReason;
    pendingImageUris?: string[];
    suggestedPlan?: SubscriptionPlanId;
  },
): void {
  const root = navigation as NavigationProp<RootStackParamList>;
  root.navigate('UpgradePaywall', params);
}
