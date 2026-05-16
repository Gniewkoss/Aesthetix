import OpenAI from 'openai';
import { File } from 'expo-file-system';
import { PhysiqueAnalysis, CoachingResponse } from '../types';
import { VISUAL_MEASUREMENT_PROMPT, buildCoachingPrompt } from '../constants';
import { VisualMeasurements, RawMeasurementResponse } from '../vision/types';
import { computeCategoryScores, computeOverallScore, computePotentialScore, logScoringDebug } from '../scoring/engine';
import { scoreMuscleGroups } from '../scoring/muscleScoring';
import { estimateBodyFatRange, midpointBodyFat } from '../scoring/bodyFat';
import { buildImprovementPlan, detectIssues, computePriorityAreas } from '../recommendations/engine';
import { MOCK_ANALYSIS, delay } from './mock';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

export type ProgressCallback = (step: string, progress: number) => void;

let _openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
      dangerouslyAllowBrowser: true,
    });
  }
  return _openai;
}

async function uriToBase64(uri: string): Promise<string> {
  return new File(uri).base64();
}

// ─── Measurement Parser ────────────────────────────────────────────────────────
// Converts the snake_case GPT response into camelCase VisualMeasurements.
// Clamps all ordinal values to the valid 0-5 range to guard against model drift.

// Development: missing → 1 (conservative). Posture/structure: missing → 2 (neutral).
function clampOrdinal(v: unknown, fallback = 1): number {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.min(Math.max(Math.round(v), 0), 5);
}

function clampStructureOrdinal(v: unknown): number {
  return clampOrdinal(v, 2);
}

function nullableOrdinal(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return clampOrdinal(v);
}

function nullableRatio(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : null;
  if (n === null || n <= 0 || n > 5) return null;
  return Math.round(n * 100) / 100;
}

function parseMeasurements(raw: RawMeasurementResponse): VisualMeasurements {
  return {
    poseType:            (['front','back','side','mixed'].includes(raw.pose_type) ? raw.pose_type : 'unknown') as VisualMeasurements['poseType'],
    visibleRegions:      Array.isArray(raw.visible_regions)     ? raw.visible_regions     : [],
    notVisibleRegions:   Array.isArray(raw.not_visible_regions) ? raw.not_visible_regions : [],
    shoulderToWaistRatio: nullableRatio(raw.shoulder_to_waist_ratio),
    shoulderToHipRatio:   nullableRatio(raw.shoulder_to_hip_ratio),
    waistToHipRatio:      nullableRatio(raw.waist_to_hip_ratio),
    chestDevelopment:    clampOrdinal(raw.chest_development),
    shoulderRoundness:   clampOrdinal(raw.shoulder_roundness),
    shoulderWidth:       clampOrdinal(raw.shoulder_width),
    armThickness:        clampOrdinal(raw.arm_thickness),
    forearmDevelopment:  clampOrdinal(raw.forearm_development),
    trapDevelopment:     clampOrdinal(raw.trap_development),
    backWidth:           nullableOrdinal(raw.back_width),
    absDefinition:       clampOrdinal(raw.abs_definition),
    obliqueDevelopment:  clampOrdinal(raw.oblique_development),
    quadDevelopment:     nullableOrdinal(raw.quad_development),
    calfDevelopment:     nullableOrdinal(raw.calf_development),
    gluteDevelopment:    nullableOrdinal(raw.glute_development),
    muscularSeparation:  clampOrdinal(raw.muscular_separation),
    vascularity:         clampOrdinal(raw.vascularity, 0),
    waistSoftness:       clampOrdinal(raw.waist_softness, 3),
    shoulderAlignment:   clampStructureOrdinal(raw.posture_shoulder_alignment),
    headPosition:        clampStructureOrdinal(raw.posture_head_position),
    spinalCurvature:     clampStructureOrdinal(raw.spinal_curvature),
    leftRightSymmetry:   clampStructureOrdinal(raw.left_right_symmetry),
    vTaperVisibility:    clampOrdinal(raw.v_taper_visibility, 1),
    latFlare:            nullableOrdinal(raw.lat_flare),
  };
}

// ─── Stage 1: Visual Measurement Extraction ────────────────────────────────────
// GPT-4o Vision reads the image(s) and outputs raw observable measurements.
// No scores are returned — only ordinal development levels and ratios.

async function extractMeasurements(
  imageContents: OpenAI.Chat.ChatCompletionContentPart[],
): Promise<VisualMeasurements> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        ...imageContents,
        { type: 'text', text: VISUAL_MEASUREMENT_PROMPT },
      ],
    }],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No measurement response from OpenAI');

  const raw = JSON.parse(content) as RawMeasurementResponse;
  return parseMeasurements(raw);
}

// ─── Stage 2: AI Coaching Layer ───────────────────────────────────────────────
// Receives pre-computed scores and muscle group data.
// Returns ONLY narrative text — never scores.

async function fetchCoaching(
  prompt: string,
): Promise<CoachingResponse> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: prompt,
    }],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No coaching response from OpenAI');

  return JSON.parse(content) as CoachingResponse;
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────────
// image → CV measurements → deterministic scoring → rule-based recommendations → AI coaching

export async function analyzePhysique(
  imageUris: string[],
  onProgress?: ProgressCallback,
): Promise<PhysiqueAnalysis> {
  if (USE_MOCK) {
    const mockStages: [string, number][] = [
      ['Preprocessing images...', 8],
      ['Extracting visual measurements...', 22],
      ['Extracting visual measurements...', 38],
      ['Measurements extracted', 52],
      ['Computing scores...', 64],
      ['Analyzing weak points...', 76],
      ['Generating coaching insights...', 88],
      ['Finalizing report...', 96],
    ];
    const totalMs = 4500 + Math.random() * 2500;
    const stepMs = totalMs / mockStages.length;
    for (const [step, progress] of mockStages) {
      onProgress?.(step, progress);
      await delay(stepMs);
    }
    onProgress?.('Complete!', 100);
    return {
      ...MOCK_ANALYSIS,
      id: `analysis_${Date.now()}`,
      createdAt: new Date().toISOString(),
      imageUris,
    };
  }

  // ── Preprocess: convert images to base64 ──────────────────────────────────
  onProgress?.('Preprocessing images...', 5);
  const imageContents: OpenAI.Chat.ChatCompletionContentPart[] = await Promise.all(
    imageUris.map(async (uri) => {
      const base64 = await uriToBase64(uri);
      return {
        type: 'image_url' as const,
        image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' as const },
      };
    }),
  );

  // ── Stage 1: Extract visual measurements ──────────────────────────────────
  onProgress?.('Extracting visual measurements...', 12);
  const measurements = await extractMeasurements(imageContents);
  onProgress?.('Measurements extracted', 58);

  // ── Stage 2: Deterministic scoring engine ────────────────────────────────
  onProgress?.('Computing scores...', 62);
  const categoryScores  = computeCategoryScores(measurements);
  const muscleGroups    = scoreMuscleGroups(measurements);
  const bodyFatResult   = estimateBodyFatRange(measurements);

  if (__DEV__) {
    console.group('[PhysiqueAnalysis] Pipeline result');
    console.log('Pose detected:', measurements.poseType);
    console.log('Visible regions:', measurements.visibleRegions);
    console.log('Shoulder/waist ratio:', measurements.shoulderToWaistRatio);
    console.log('Body fat estimate:', bodyFatResult.label);
    console.log('Category scores:', categoryScores);
    console.log('Muscle group scores:', Object.fromEntries(
      Object.entries(muscleGroups).map(([k, v]) => [k, v.visible ? v.score : 'hidden']),
    ));
    console.groupEnd();
  }

  const visibleMuscleScores = Object.values(muscleGroups)
    .filter((g) => g.visible && g.score > 0)
    .map((g) => g.score);

  const bodyFatMid      = midpointBodyFat(bodyFatResult);
  const overallScore    = computeOverallScore(categoryScores, visibleMuscleScores, measurements, bodyFatMid);
  const potentialScore  = computePotentialScore(overallScore, visibleMuscleScores, bodyFatResult.max);
  logScoringDebug(measurements, categoryScores, overallScore);

  // ── Stage 3: Rule-based recommendation engine ─────────────────────────────
  onProgress?.('Analyzing weak points...', 68);
  const issues          = detectIssues(muscleGroups, categoryScores, measurements);
  const improvementPlan = buildImprovementPlan(muscleGroups, categoryScores, measurements);
  const priorityAreas   = computePriorityAreas(muscleGroups);

  // ── Stage 4: AI coaching layer (text only) ────────────────────────────────
  onProgress?.('Generating coaching insights...', 74);
  const coachingPrompt = buildCoachingPrompt(
    categoryScores,
    muscleGroups,
    bodyFatResult.label,
    issues,
    measurements.visibleRegions,
    measurements.notVisibleRegions,
  );
  const coaching = await fetchCoaching(coachingPrompt);
  onProgress?.('Finalizing report...', 96);

  // ── Merge: scores (deterministic) + narrative (coaching) ──────────────────
  const MUSCLE_KEYS = ['shoulders','chest','biceps','triceps','back','traps','abs','forearms','quads','calves','glutes'] as const;
  for (const key of MUSCLE_KEYS) {
    const coachData = coaching.muscle_groups?.[key];
    if (coachData && muscleGroups[key].visible) {
      muscleGroups[key].strengths       = coachData.strengths       ?? [];
      muscleGroups[key].weaknesses      = coachData.weaknesses      ?? [];
      muscleGroups[key].recommendations = coachData.recommendations ?? [];
    }
  }

  return {
    id:                    `analysis_${Date.now()}`,
    createdAt:             new Date().toISOString(),
    imageUris,
    visibleBodyParts:      measurements.visibleRegions,
    notVisibleBodyParts:   measurements.notVisibleRegions,
    overallScore,
    bodyFat:               bodyFatMid,
    bodyFatRange:          bodyFatResult.label,
    muscularity:           categoryScores.muscularity,
    aestheticsScore:       categoryScores.aesthetics,
    proportionsScore:      categoryScores.proportions,
    symmetryScore:         categoryScores.symmetry,
    vTaperScore:           categoryScores.vTaper,
    postureScore:          categoryScores.posture,
    athleticismScore:      categoryScores.athleticism,
    muscleGroups,
    issuesDetected:        issues,
    improvementPlan,
    dietaryRecommendations: coaching.dietary_recommendations ?? [],
    priorityAreas,
    glowUpPrediction:      coaching.glow_up_prediction ?? '',
    predictedPotentialScore: potentialScore,
    summary:               coaching.summary ?? '',
  };
}
