// Client-side helpers for calling Supabase Edge Functions.
// OpenAI is never called from here — the Edge Functions proxy those requests.

import { File } from 'expo-file-system';
import { supabase } from './supabase';
import { CoachingResponse, PhysiqueAnalysis } from '../types';
import { RawMeasurementResponse } from '../vision/types';
import { optimizeImageForAnalysis } from '../lib/imageValidation';
import { getInstallationDeviceId } from '../lib/deviceId';
import { withPerfSpan } from '../lib/performance';
import { logScan } from '../lib/scanLog';
import { captureException } from '../lib/errorTracking';

export type ScanPose = 'front' | 'back';

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${session?.access_token ?? ANON_KEY}`,
  };
}

// ── Stage 1: Visual measurement extraction ─────────────────────────────────────
// Sends images to the analyze Edge Function which calls GPT-4o Vision server-side.
// Rate limit enforced on server; throws with code 'RATE_LIMITED' if exceeded.

export async function callAnalyze(
  imageUris: string[],
  poses: ScanPose[],
): Promise<{ scanId: string; rawMeasurements: RawMeasurementResponse }> {
  return withPerfSpan('callAnalyze', 'http', async () => {
  // Downscale + recompress before encoding: smaller payloads, less RN memory churn.
  const imageBase64s = await Promise.all(
    imageUris.map(async (uri) => {
      const optimized = await optimizeImageForAnalysis(uri);
      return new File(optimized).base64();
    }),
  );

  const deviceId = await getInstallationDeviceId();

  const resp = await fetch(`${FUNCTIONS_URL}/analyze`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ imageBase64s, poses, deviceId }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    logScan('analyze_api_error', { status: resp.status, code: data.code });
    const err = new Error(data.error ?? 'Analysis request failed') as Error & { code?: string };
    err.code = data.code;
    throw err;
  }

  logScan('analyze_api_ok', { scanId: data.scanId });
  return data as { scanId: string; rawMeasurements: RawMeasurementResponse };
  });
}

// ── Stage 4: AI coaching narrative ────────────────────────────────────────────
// Sends the pre-built coaching prompt (assembled from client-side scoring results)
// to the coach Edge Function which calls GPT-4o server-side.

export async function callCoach(
  prompt: string,
  scanId?: string,
): Promise<CoachingResponse> {
  const resp = await fetch(`${FUNCTIONS_URL}/coach`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ prompt, scanId }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error ?? 'Coaching request failed');
  }

  return data as CoachingResponse;
}

// ── Persist final analysis to Supabase ────────────────────────────────────────
// Called after client-side scoring completes. The scan row was created by the
// analyze Edge Function (pending); this updates it with the complete analysis.

export async function saveScanToSupabase(
  scanId: string,
  analysis: PhysiqueAnalysis,
): Promise<void> {
  const payload: PhysiqueAnalysis = { ...analysis, id: scanId };
  logScan('save_start', { scanId });

  const { data, error } = await supabase
    .from('scans')
    .update({ analysis: payload })
    .eq('id', scanId)
    .select('id')
    .maybeSingle();

  if (error) {
    logScan('save_error', { scanId, message: error.message });
    captureException(new Error(error.message), { op: 'saveScanToSupabase', scanId });
    throw new Error(`Failed to save scan report: ${error.message}`);
  }
  if (!data) {
    logScan('save_no_row', { scanId });
    const err = new Error('Failed to save scan report: scan row not found');
    captureException(err, { op: 'saveScanToSupabase', scanId });
    throw err;
  }

  logScan('save_ok', { scanId });
}
