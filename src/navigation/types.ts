import { MuscleGroupAnalysis, MuscleGroupKey } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  MainTabs: undefined;
  Upload: undefined;
  AnalysisLoading: { imageUris: string[] };
  Dashboard: { analysisId: string };
  MuscleDetail: { muscleKey: MuscleGroupKey; analysis: MuscleGroupAnalysis };
  Premium: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Progress: undefined;
  Recommendations: undefined;
  Profile: undefined;
};
