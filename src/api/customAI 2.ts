// Custom AI backend client.
// Replaces the GPT-4o measurement extraction call in analyzeViaBackend().
//
// The response shape is identical to callAnalyze() — both return
// { scanId, rawMeasurements: RawMeasurementResponse } — so parseMeasurements()
// and the downstream scoring engine require zero changes.

import { File } from 'expo-file-system';
import { RawMeasurementResponse } from '../vision/types';

const AI_BACKEND_URL = process.env.EXPO_PUBLIC_AI_BACKEND_URL ?? '';
const AI_BACKEND_KEY = process.env.EXPO_PUBLIC_AI_BACKEND_KEY ?? '';

export const isCustomAIConfigured = Boolean(AI_BACKEND_URL);

interface CustomAIAnalyzeResponse {
  scan_id: string;
  raw_measurements: RawMeasurementResponse;
  confidence: number;
  model_version: string;
}

export async function callCustomAIAnalyze(
  imageUris: string[],
  scanId?: string,
): Promise<{ scanId: string; rawMeasurements: RawMeasurementResponse; confidence: number }> {
  const imageBase64s = await Promise.all(
    imageUris.map((uri) => new File(uri).base64()),
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (AI_BACKEND_KEY) {
    headers['Authorization'] = `Bearer ${AI_BACKEND_KEY}`;
  }

  const resp = await fetch(`${AI_BACKEND_URL}/analyze-body`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      image_base64s: imageBase64s,
      scan_id: scanId,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    const error = new Error(err.detail ?? err.error ?? 'Custom AI analysis failed') as Error & { code?: string };
    if (resp.status === 429) error.code = 'RATE_LIMITED';
    throw error;
  }

  const data = (await resp.json()) as CustomAIAnalyzeResponse;
  return {
    scanId: data.scan_id,
    rawMeasurements: data.raw_measurements,
    confidence: data.confidence,
  };
}

export async function checkCustomAIHealth(): Promise<{
  ok: boolean;
  modelLoaded: boolean;
  activeVersion: string | null;
}> {
  try {
    const resp = await fetch(`${AI_BACKEND_URL}/health`);
    if (!resp.ok) return { ok: false, modelLoaded: false, activeVersion: null };
    const data = await resp.json();
    return {
      ok: true,
      modelLoaded: data.model_loaded ?? false,
      activeVersion: data.active_version ?? null,
    };
  } catch {
    return { ok: false, modelLoaded: false, activeVersion: null };
  }
}
