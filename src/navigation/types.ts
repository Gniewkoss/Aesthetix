import { MuscleGroupAnalysis, MuscleGroupKey } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  MainTabs: undefined;
  Upload: undefined;
  AnalysisLoading: { imageUris: string[] };
  Dashboard: { analysisId: string };
  MuscleDetail: { muscleKey: MuscleGroupKey; analysis: MuscleGroupAnalysis };
  Premium: { pendingImageUris?: string[] } | undefined;
  Achievements: undefined;
  Notifications: undefined;
  PrivacyData: undefined;
  HelpSupport: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Progress: undefined;
  Recommendations: undefined;
  Profile: undefined;
};
