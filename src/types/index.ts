// ─── Analysis Types ───────────────────────────────────────────────────────────

export interface MuscleGroupAnalysis {
  visible: boolean;
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
  imageUris: string[];
  visibleBodyParts: string[];
  notVisibleBodyParts: string[];
  overallScore: number;
  // bodyFat kept as midpoint number for progress-tracking charts
  bodyFat: number;
  // bodyFatRange is the display value, e.g. "13–17%"
  bodyFatRange: string;
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
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  Upload: undefined;
  AnalysisLoading: { imageUris: string[] };
  Dashboard: { analysisId: string };
  MuscleDetail: { muscleKey: MuscleGroupKey; analysis: MuscleGroupAnalysis };
  Premium: { pendingImageUris?: string[] } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Progress: undefined;
  Recommendations: undefined;
  Profile: undefined;
};

// ─── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Coaching Response ─────────────────────────────────────────────────────────
// Shape of the JSON returned by the AI coaching call (Stage 2 of the pipeline).
// Scores are NEVER in this response — only narrative text.

export interface CoachingResponse {
  summary: string;
  muscle_groups: Record<string, {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }>;
  glow_up_prediction: string;
  dietary_recommendations: {
    category: string;
    recommendation: string;
    rationale: string;
  }[];
}
