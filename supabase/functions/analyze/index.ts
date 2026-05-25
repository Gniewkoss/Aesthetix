// Supabase Edge Function — analyze
// Validates auth, enforces server-side rate limit, calls GPT-4o Vision,
// returns raw measurement JSON to the client for deterministic scoring.
// OpenAI key stays server-side; never exposed to the mobile app.
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_SCANS_PER_DAY = 1;

const VISUAL_MEASUREMENT_PROMPT = `You are a professional physique assessment analyst (bodybuilding & sports science background).

Your job is to extract precise, differentiated visual measurements. Measurements must clearly distinguish trained vs untrained physiques — do NOT cluster everyone in the same range.

━━━ MULTI-IMAGE HANDLING ━━━
If MULTIPLE images are provided:
• Examine ALL images carefully before responding.
• visible_regions and not_visible_regions must reflect the COMBINED set across ALL images.
• pose_type must be "mixed" if different images show different orientations (e.g. front + back).
• For measurement fields, use the most clearly visible image for each body part.
• NEVER skip an image. If one image shows the back and another shows the front, both must be analyzed.

━━━ ORDINAL SCALE REFERENCE (0–5) ━━━
Score relative to the GENERAL population. Use the FULL range — differentiation is critical.
  0 = absent — no visible muscle; sedentary; high body fat hiding any definition
  1 = minimal — untrained; soft; overweight with little muscle; no gym evidence
  2 = recreational — trains occasionally OR lean but little muscle; modest shape
  3 = trained — regular gym (1–3 yrs); clearly works out; visible muscle in multiple areas
  4 = advanced — serious lifter; athletic; low-moderate BF; impressive from any angle
  5 = elite — competition-level; top ~1%; use only when truly exceptional

━━━ OUTPUT FORMAT ━━━
Output ONLY valid JSON with exactly these fields:
{
  "pose_type": "<front|back|side|mixed>",
  "visible_regions": ["<list across ALL images>"],
  "not_visible_regions": ["<areas not visible in ANY image>"],
  "shoulder_to_waist_ratio": <decimal or null>,
  "shoulder_to_hip_ratio": <decimal or null>,
  "waist_to_hip_ratio": <decimal or null>,
  "chest_development": <0-5>,
  "shoulder_roundness": <0-5>,
  "shoulder_width": <0-5>,
  "arm_thickness": <0-5>,
  "forearm_development": <0-5>,
  "trap_development": <0-5>,
  "back_width": <0-5 or null if no back pose>,
  "abs_definition": <0-5>,
  "oblique_development": <0-5>,
  "quad_development": <0-5 or null>,
  "calf_development": <0-5 or null>,
  "glute_development": <0-5 or null>,
  "muscular_separation": <0-5>,
  "vascularity": <0-5>,
  "waist_softness": <0-5 where 0=very lean, 5=very soft/high bodyfat>,
  "posture_shoulder_alignment": <0-5 where 5=perfectly level>,
  "posture_head_position": <0-5 where 5=perfect neutral>,
  "spinal_curvature": <0-5 where 5=ideal natural curve>,
  "left_right_symmetry": <0-5 where 5=perfect bilateral symmetry>,
  "v_taper_visibility": <0-5 where 5=dramatic V-silhouette>,
  "lat_flare": <0-5 or null if no back pose>
}`;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

    // Use user's JWT to scope DB queries to their own rows (RLS enforced)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, scans_today, last_scan_reset_date')
      .eq('id', user.id)
      .single();

    const isNewDay = !profile?.last_scan_reset_date || profile.last_scan_reset_date !== today;
    const scansToday = isNewDay ? 0 : (profile?.scans_today ?? 0);
    const isPremium = profile?.is_premium ?? false;

    if (!isPremium && scansToday >= FREE_SCANS_PER_DAY) {
      return jsonResponse({ error: 'Daily scan limit reached. Upgrade to Premium for unlimited scans.', code: 'RATE_LIMITED' }, 429);
    }

    // ── Parse request ─────────────────────────────────────────────────────────
    const body = await req.json();
    const imageBase64s: string[] = body.imageBase64s;
    if (!Array.isArray(imageBase64s) || imageBase64s.length === 0) {
      return jsonResponse({ error: 'imageBase64s array is required' }, 400);
    }
    if (imageBase64s.length > 3) {
      return jsonResponse({ error: 'Maximum 3 images allowed' }, 400);
    }

    // ── Increment scan counter (before OpenAI call to prevent abuse on retry) ──
    await supabase.from('profiles').update({
      scans_today: scansToday + 1,
      last_scan_reset_date: today,
      last_scan_date: new Date().toISOString(),
    }).eq('id', user.id);

    // ── Create pending scan record ────────────────────────────────────────────
    const { data: scan } = await supabase
      .from('scans')
      .insert({ user_id: user.id, analysis: null })
      .select('id')
      .single();

    const scanId = scan?.id ?? `scan_${Date.now()}`;

    // ── GPT-4o Vision: extract measurements ──────────────────────────────────
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

    const imageContents = imageBase64s.map((b64: string) => ({
      type: 'image_url' as const,
      image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'high' as const },
    }));

    const measurementResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          { type: 'text' as const, text: VISUAL_MEASUREMENT_PROMPT },
        ],
      }],
      response_format: { type: 'json_object' },
    });

    const content = measurementResponse.choices[0]?.message?.content;
    if (!content) return jsonResponse({ error: 'No response from vision model' }, 500);

    const rawMeasurements = JSON.parse(content);

    return jsonResponse({ scanId, rawMeasurements });

  } catch (err: any) {
    console.error('[analyze]', err);
    return jsonResponse({ error: err?.message ?? 'Internal error' }, 500);
  }
});
