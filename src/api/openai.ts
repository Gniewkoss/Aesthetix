// ─── Analysis Pipeline ─────────────────────────────────────────────────────────
//
// Mode routing (checked in order):
//   1. EXPO_PUBLIC_USE_MOCK_API=true  → fast local mock, no network
//   2. EXPO_PUBLIC_SUPABASE_URL set   → backend mode (Supabase Edge Functions)
//   3. EXPO_PUBLIC_OPENAI_API_KEY set → legacy direct call (dev only; remove in prod)
//
// In backend mode the OpenAI key lives in Supabase secrets only — never in the
// app bundle. The client handles deterministic scoring; the Edge Functions handle
// the two LLM calls.

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
import { isSupabaseConfigured } from './supabase';
import { callAnalyze, callCoach, saveScanToSupabase } from './backend';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

export type ProgressCallback = (step: string, progress: number) => void;

// ─── Measurement Parser ────────────────────────────────────────────────────────

function clampOrdinal(v: unknown, fallback = 1): number {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.min(Math.max(Math.round(v), 0), 5);
}
function clampStructureOrdinal(v: unknown): number { return clampOrdinal(v, 2); }
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

export function parseMeasurements(raw: RawMeasurementResponse): VisualMeasurements {
  return {
    poseType:             (['front','back','side','mixed'].includes(raw.pose_type) ? raw.pose_type : 'unknown') as VisualMeasurements['poseType'],
    visibleRegions:       Array.isArray(raw.visible_regions)     ? raw.visible_regions     : [],
    notVisibleRegions:    Array.isArray(raw.not_visible_regions) ? raw.not_visible_regions : [],
    shoulderToWaistRatio: nullableRatio(raw.shoulder_to_waist_ratio),
    shoulderToHipRatio:   nullableRatio(raw.shoulder_to_hip_ratio),
    waistToHipRatio:      nullableRatio(raw.waist_to_hip_ratio),
    chestDevelopment:     clampOrdinal(raw.chest_development),
    shoulderRoundness:    clampOrdinal(raw.shoulder_roundness),
    shoulderWidth:        clampOrdinal(raw.shoulder_width),
    armThickness:         clampOrdinal(raw.arm_thickness),
    forearmDevelopment:   clampOrdinal(raw.forearm_development),
    trapDevelopment:      clampOrdinal(raw.trap_development),
    backWidth:            nullableOrdinal(raw.back_width),
    absDefinition:        clampOrdinal(raw.abs_definition),
    obliqueDevelopment:   clampOrdinal(raw.oblique_development),
    quadDevelopment:      nullableOrdinal(raw.quad_development),
    calfDevelopment:      nullableOrdinal(raw.calf_development),
    gluteDevelopment:     nullableOrdinal(raw.glute_development),
    muscularSeparation:   clampOrdinal(raw.muscular_separation),
    vascularity:          clampOrdinal(raw.vascularity, 0),
    waistSoftness:        clampOrdinal(raw.waist_softness, 3),
    shoulderAlignment:    clampStructureOrdinal(raw.posture_shoulder_alignment),
    headPosition:         clampStructureOrdinal(raw.posture_head_position),
    spinalCurvature:      clampStructureOrdinal(raw.spinal_curvature),
    leftRightSymmetry:    clampStructureOrdinal(raw.left_right_symmetry),
    vTaperVisibility:     clampOrdinal(raw.v_taper_visibility, 1),
    latFlare:             nullableOrdinal(raw.lat_flare),
  };
}

// ─── Shared: build PhysiqueAnalysis from scored parts ─────────────────────────

function assemblePipeline(
  measurements: VisualMeasurements,
  coaching: CoachingResponse,
  imageUris: string[],
): PhysiqueAnalysis {
  const categoryScores  = computeCategoryScores(measurements);
  const muscleGroups    = scoreMuscleGroups(measurements);
  const bodyFatResult   = estimateBodyFatRange(measurements);
  const bodyFatMid      = midpointBodyFat(bodyFatResult);

  const visibleMuscleScores = Object.values(muscleGroups)
    .filter((g) => g.visible && g.score > 0)
    .map((g) => g.score);

  const overallScore   = computeOverallScore(categoryScores, visibleMuscleScores, measurements, bodyFatMid);
  const potentialScore = computePotentialScore(overallScore, visibleMuscleScores, bodyFatResult.max);
  logScoringDebug(measurements, categoryScores, overallScore);

  const issues         = detectIssues(muscleGroups, categoryScores, measurements);
  const improvementPlan = buildImprovementPlan(muscleGroups, categoryScores, measurements);
  const priorityAreas  = computePriorityAreas(muscleGroups);

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

// ─── Backend Mode ──────────────────────────────────────────────────────────────
// Stage 1 (measurements) and Stage 4 (coaching) are both proxied through
// Supabase Edge Functions. Client handles stages 2+3 (scoring + recommendations).

async function analyzeViaBackend(
  imageUris: string[],
  onProgress?: ProgressCallback,
): Promise<PhysiqueAnalysis> {
  onProgress?.('Preprocessing images...', 5);

  // Stage 1 — server-side: auth + rate limit + GPT-4o Vision
  onProgress?.('Extracting visual measurements...', 12);
  const { scanId, rawMeasurements } = await callAnalyze(imageUris);
  onProgress?.('Measurements extracted', 58);

  // Stage 2+3 — client-side: scoring + recommendations (no secrets needed)
  onProgress?.('Computing scores...', 62);
  const measurements = parseMeasurements(rawMeasurements);
  const categoryScores = computeCategoryScores(measurements);
  const muscleGroups   = scoreMuscleGroups(measurements);
  const bodyFatResult  = estimateBodyFatRange(measurements);

  onProgress?.('Analyzing weak points...', 68);
  const issues         = detectIssues(muscleGroups, categoryScores, measurements);

  // Stage 4 — server-side: AI coaching narrative
  onProgress?.('Generating coaching insights...', 74);
  const coachingPrompt = buildCoachingPrompt(
    categoryScores,
    muscleGroups,
    bodyFatResult.label,
    issues,
    measurements.visibleRegions,
    measurements.notVisibleRegions,
  );
  const coaching = await callCoach(coachingPrompt, scanId);
  onProgress?.('Finalizing report...', 96);

  const analysis = assemblePipeline(measurements, coaching, imageUris);

  // Persist completed analysis to DB (fire-and-forget; local state already updated)
  saveScanToSupabase(scanId, analysis).catch((e) => console.warn('[backend] save failed', e));

  return analysis;
}

// ─── Legacy Direct Mode ────────────────────────────────────────────────────────
// Used in local development when Supabase is not configured but an OpenAI key is.
// NOT intended for production builds — the key must not be in the app bundle.

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

async function extractMeasurementsDirect(
  imageUris: string[],
): Promise<VisualMeasurements> {
  const client = getClient();
  const imageContents: OpenAI.Chat.ChatCompletionContentPart[] = await Promise.all(
    imageUris.map(async (uri) => ({
      type: 'image_url' as const,
      image_url: { url: `data:image/jpeg;base64,${await new File(uri).base64()}`, detail: 'high' as const },
    })),
  );
  const resp = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [{ role: 'user', content: [...imageContents, { type: 'text', text: VISUAL_MEASUREMENT_PROMPT }] }],
    response_format: { type: 'json_object' },
  });
  return parseMeasurements(JSON.parse(resp.choices[0]?.message?.content ?? '{}') as RawMeasurementResponse);
}

async function fetchCoachingDirect(prompt: string): Promise<CoachingResponse> {
  const resp = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? '{}') as CoachingResponse;
}

async function analyzeDirect(
  imageUris: string[],
  onProgress?: ProgressCallback,
): Promise<PhysiqueAnalysis> {
  onProgress?.('Preprocessing images...', 5);
  onProgress?.('Extracting visual measurements...', 12);
  const measurements = await extractMeasurementsDirect(imageUris);
  onProgress?.('Measurements extracted', 58);

  onProgress?.('Computing scores...', 62);
  const categoryScores = computeCategoryScores(measurements);
  const muscleGroups   = scoreMuscleGroups(measurements);
  const bodyFatResult  = estimateBodyFatRange(measurements);

  onProgress?.('Analyzing weak points...', 68);
  const issues = detectIssues(muscleGroups, categoryScores, measurements);

  onProgress?.('Generating coaching insights...', 74);
  const coachingPrompt = buildCoachingPrompt(
    categoryScores, muscleGroups, bodyFatResult.label, issues,
    measurements.visibleRegions, measurements.notVisibleRegions,
  );
  const coaching = await fetchCoachingDirect(coachingPrompt);
  onProgress?.('Finalizing report...', 96);

  return assemblePipeline(measurements, coaching, imageUris);
}

// ─── Main entry point ──────────────────────────────────────────────────────────

export async function analyzePhysique(
  imageUris: string[],
  onProgress?: ProgressCallback,
): Promise<PhysiqueAnalysis> {
  if (USE_MOCK) {
    const stages: [string, number][] = [
      ['Preprocessing images...', 8],
      ['Extracting visual measurements...', 22],
      ['Extracting visual measurements...', 38],
      ['Measurements extracted', 52],
      ['Computing scores...', 64],
      ['Analyzing weak points...', 76],
      ['Generating coaching insights...', 88],
      ['Finalizing report...', 96],
    ];
    const stepMs = (4500 + Math.random() * 2500) / stages.length;
    for (const [step, progress] of stages) {
      onProgress?.(step, progress);
      await delay(stepMs);
    }
    onProgress?.('Complete!', 100);
    return { ...MOCK_ANALYSIS, id: `analysis_${Date.now()}`, createdAt: new Date().toISOString(), imageUris };
  }

  if (isSupabaseConfigured) {
    return analyzeViaBackend(imageUris, onProgress);
  }

  // Local dev fallback — requires EXPO_PUBLIC_OPENAI_API_KEY in .env
  return analyzeDirect(imageUris, onProgress);
}
