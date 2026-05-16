import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { PhysiqueAnalysis, OpenAIAnalysisResponse } from '../types';
import { PHYSIQUE_ANALYSIS_PROMPT } from '../constants';
import { MOCK_ANALYSIS, delay } from './mock';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

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
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

function mapApiResponse(raw: OpenAIAnalysisResponse, imageUris: string[]): PhysiqueAnalysis {
  return {
    id: `analysis_${Date.now()}`,
    createdAt: new Date().toISOString(),
    imageUris,
    overallScore: raw.overall_score,
    bodyFat: raw.body_fat,
    muscularity: raw.muscularity,
    aestheticsScore: raw.aesthetics_score,
    proportionsScore: raw.proportions_score,
    symmetryScore: raw.symmetry_score,
    vTaperScore: raw.v_taper_score,
    postureScore: raw.posture_score,
    athleticismScore: raw.athleticism_score,
    muscleGroups: {
      shoulders: raw.muscle_groups.shoulders,
      chest: raw.muscle_groups.chest,
      biceps: raw.muscle_groups.biceps,
      triceps: raw.muscle_groups.triceps,
      back: raw.muscle_groups.back,
      traps: raw.muscle_groups.traps,
      abs: raw.muscle_groups.abs,
      forearms: raw.muscle_groups.forearms,
      quads: raw.muscle_groups.quads,
      calves: raw.muscle_groups.calves,
      glutes: raw.muscle_groups.glutes,
    },
    issuesDetected: raw.issues_detected.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      severity: i.severity,
      category: i.category,
    })),
    improvementPlan: raw.improvement_plan.map((p) => ({
      priority: p.priority,
      area: p.area,
      action: p.action,
      timeframe: p.timeframe,
      expectedResult: p.expected_result,
    })),
    dietaryRecommendations: raw.dietary_recommendations,
    priorityAreas: raw.priority_areas,
    glowUpPrediction: raw.glow_up_prediction,
    predictedPotentialScore: raw.predicted_potential_score,
    summary: raw.summary,
  };
}

export async function analyzePhysique(imageUris: string[]): Promise<PhysiqueAnalysis> {
  if (USE_MOCK) {
    // Simulate realistic API delay
    await delay(4000 + Math.random() * 3000);
    return { ...MOCK_ANALYSIS, id: `analysis_${Date.now()}`, createdAt: new Date().toISOString(), imageUris };
  }

  const client = getClient();

  // Convert each image URI to base64
  const imageContents: OpenAI.Chat.ChatCompletionContentPart[] = await Promise.all(
    imageUris.map(async (uri) => {
      const base64 = await uriToBase64(uri);
      return {
        type: 'image_url' as const,
        image_url: {
          url: `data:image/jpeg;base64,${base64}`,
          detail: 'high' as const,
        },
      };
    })
  );

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: PHYSIQUE_ANALYSIS_PROMPT,
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI');

  const raw = JSON.parse(content) as OpenAIAnalysisResponse;
  return mapApiResponse(raw, imageUris);
}
