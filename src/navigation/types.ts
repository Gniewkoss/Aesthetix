import type { NavigatorScreenParams } from '@react-navigation/native';
import { MuscleGroupAnalysis, MuscleGroupKey } from '../types';
import type { UpgradeReason } from '../subscription/upgradeReasons';
import type { SubscriptionPlanId } from '../subscription/subscription';

export type CoachTab = 'plan' | 'chat';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Upload: undefined;
  AnalysisLoading: { imageUris: string[] };
  Dashboard: { analysisId: string };
  MuscleDetail: { muscleKey: MuscleGroupKey; analysis: MuscleGroupAnalysis };
  UpgradePaywall: {
    reason?: UpgradeReason;
    pendingImageUris?: string[];
    suggestedPlan?: SubscriptionPlanId;
  } | undefined;
  ManageSubscription: { pendingImageUris?: string[] } | undefined;
  Achievements: undefined;
  Notifications: undefined;
  PrivacyData: undefined;
  HelpSupport: undefined;
  Appearance: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Progress: undefined;
  Recommendations: { tab?: CoachTab } | undefined;
  Profile: undefined;
};
