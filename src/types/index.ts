// ─── Analysis Types ───────────────────────────────────────────────────────────

export interface MuscleGroupAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MuscleGroups {
  shoulders: MuscleGroupAnalysis;
  chest: MuscleGroupAnalysis;
  biceps: MuscleGroupAnalysis;
  triceps: MuscleGroupAnalysis;
  back: MuscleGroupAnalysis;
  traps: MuscleGroupAnalysis;
  abs: MuscleGroupAnalysis;
  forearms: MuscleGroupAnalysis;
  quads: MuscleGroupAnalysis;
  calves: MuscleGroupAnalysis;
  glutes: MuscleGroupAnalysis;
}

export type MuscleGroupKey = keyof MuscleGroups;

export interface IssueDetected {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'proportion' | 'symmetry' | 'posture' | 'composition' | 'balance';
}

export interface ImprovementPlanItem {
  priority: number;
  area: string;
  action: string;
  timeframe: string;
  expectedResult: string;
}

export interface DietaryRecommendation {
  category: string;
  recommendation: string;
  rationale: string;
}

export interface PhysiqueAnalysis {
  id: string;
  createdAt: string;
  overallScore: number;
  bodyFat: number;
  muscularity: number;
  aestheticsScore: number;
  proportionsScore: number;
  symmetryScore: number;
  vTaperScore: number;
  postureScore: number;
  athleticismScore: number;
  muscleGroups: MuscleGroups;
  issuesDetected: IssueDetected[];
  improvementPlan: ImprovementPlanItem[];
  dietaryRecommendations: DietaryRecommendation[];
  priorityAreas: string[];
  glowUpPrediction: string;
  predictedPotentialScore: number;
  summary: string;
  imageUris: string[];
}

// ─── User / Auth Types ────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPremium: boolean;
  scansToday: number;
  maxScansPerDay: number;
  xp: number;
  level: number;
  rank: PhysiqueRank;
  streak: number;
  lastScanDate?: string;
  joinedAt: string;
}

export type PhysiqueRank =
  | 'Beginner'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Elite'
  | 'Legendary';

// ─── Progress Types ───────────────────────────────────────────────────────────

export interface ProgressEntry {
  date: string;
  overallScore: number;
  bodyFat: number;
  symmetryScore: number;
  vTaperScore: number;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

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

// ─── API Types ────────────────────────────────────────────────────────────────

export interface OpenAIAnalysisResponse {
  overall_score: number;
  body_fat: number;
  muscularity: number;
  aesthetics_score: number;
  proportions_score: number;
  symmetry_score: number;
  v_taper_score: number;
  posture_score: number;
  athleticism_score: number;
  muscle_groups: {
    shoulders: RawMuscleGroup;
    chest: RawMuscleGroup;
    biceps: RawMuscleGroup;
    triceps: RawMuscleGroup;
    back: RawMuscleGroup;
    traps: RawMuscleGroup;
    abs: RawMuscleGroup;
    forearms: RawMuscleGroup;
    quads: RawMuscleGroup;
    calves: RawMuscleGroup;
    glutes: RawMuscleGroup;
  };
  issues_detected: {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    category: 'proportion' | 'symmetry' | 'posture' | 'composition' | 'balance';
  }[];
  improvement_plan: {
    priority: number;
    area: string;
    action: string;
    timeframe: string;
    expected_result: string;
  }[];
  dietary_recommendations: {
    category: string;
    recommendation: string;
    rationale: string;
  }[];
  priority_areas: string[];
  glow_up_prediction: string;
  predicted_potential_score: number;
  summary: string;
}

export interface RawMuscleGroup {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
