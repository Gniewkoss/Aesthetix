// Supabase Edge Function — analyze
// Validates auth, enforces server-side rate limit, calls GPT-4o Vision,
// returns raw measurement JSON to the client for deterministic scoring.
// OpenAI key stays server-side; never exposed to the mobile app.
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';

async function hashEntitlementValue(value: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${pepper}:${value}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function tierFromProductId(productId: string | null | undefined): string {
  if (!productId) return 'pro';
  const lower = productId.toLowerCase();
  if (lower.includes('week')) return 'starter';
  if (lower.includes('max')) return 'max';
  if (lower.includes('month')) return 'pro';
  return 'pro';
}

/**
 * Synchronous entitlement check against the RevenueCat REST API. The webhook is the
 * persisted source of truth, but it is delivered asynchronously and can be late or
 * (mis)configured. This closes the race where a user buys Premium and immediately
 * tries to scan before profiles.is_premium has flipped. Returns the active paid tier
 * or null. Safe-fails to null (never grants on error).
 */
async function revenueCatActiveTier(appUserId: string): Promise<string | null> {
  const key = Deno.env.get('REVENUECAT_REST_API_KEY');
  if (!key) return null;
  try {
    const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const ents = j?.subscriber?.entitlements ?? {};
    const now = Date.now();
    let tier: string | null = null;
    for (const ent of Object.values<any>(ents)) {
      const exp = ent?.expires_date ? Date.parse(ent.expires_date) : Number.POSITIVE_INFINITY;
      if (exp > now) {
        const t = tierFromProductId(ent?.product_identifier);
        // keep the highest tier seen (max > pro > starter)
        if (t === 'max' || (t === 'pro' && tier !== 'max') || tier === null) tier = t;
      }
    }
    return tier;
  } catch (e) {
    console.error('[analyze] revenueCatActiveTier failed', e);
    return null;
  }
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip');
}

function ipBucket(ip: string): string {
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
}

// Narrow CORS to a known origin in production via ALLOWED_ORIGIN (set with
// `supabase secrets set ALLOWED_ORIGIN=...`). Native mobile clients send no Origin
// header, so the default '*' is only relevant to web callers.
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STARTER_SCANS_PER_DAY = 1;

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

    // Service-role client for privileged writes (the scan counter). is_premium and
    // scans_today are no longer client-writable (RLS trigger), so the counter must be
    // bumped server-side or the rate limit can't be enforced.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    // ── Parse request (before paid API calls) ─────────────────────────────────
    const body = await req.json();
    const imageBase64s: string[] = body.imageBase64s;
    const poses: string[] = Array.isArray(body.poses) ? body.poses : [];
    const deviceId: string | undefined = typeof body.deviceId === 'string' ? body.deviceId : undefined;

    if (!Array.isArray(imageBase64s) || imageBase64s.length === 0) {
      return jsonResponse({ error: 'imageBase64s array is required' }, 400);
    }
    if (imageBase64s.length > 3) {
      return jsonResponse({ error: 'Maximum 3 images allowed' }, 400);
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, is_premium, scans_today, last_scan_reset_date, free_scan_used')
      .eq('id', user.id)
      .single();

    const isNewDay = !profile?.last_scan_reset_date || profile.last_scan_reset_date !== today;
    const scansToday = isNewDay ? 0 : (profile?.scans_today ?? 0);
    let tier = profile?.subscription_tier
      ?? (profile?.is_premium ? 'pro' : 'free');

    // ── Entitlement self-heal ──────────────────────────────────────────────────
    // If the DB still says free, the user may have just purchased and the webhook
    // hasn't landed yet. Verify synchronously with RevenueCat's REST API; if active,
    // heal profiles immediately so the scan proceeds (no "premium not synced" block).
    if (tier === 'free') {
      const rcTier = await revenueCatActiveTier(user.id);
      if (rcTier) {
        await admin
          .from('profiles')
          .update({ is_premium: true, subscription_tier: rcTier })
          .eq('id', user.id);
        console.log('[analyze] webhook_self_heal', { userId: user.id, rcTier });
        tier = rcTier;
      }
    }

    if (tier === 'free') {
      if (profile?.free_scan_used) {
        return jsonResponse({
          error: 'Your free scan was already used on this account. Subscribe for more scans.',
          code: 'RATE_LIMITED',
        }, 429);
      }

      const { count: completedScans } = await admin
        .from('scans')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('analysis', 'is', null);

      if ((completedScans ?? 0) > 0) {
        await admin.from('profiles').update({ free_scan_used: true }).eq('id', user.id);
        return jsonResponse({
          error: 'Your free scan was already used on this account. Subscribe for more scans.',
          code: 'RATE_LIMITED',
        }, 429);
      }

      const hasBackPose = poses.includes('back') || imageBase64s.length > 1;
      if (hasBackPose) {
        return jsonResponse({
          error: 'Back pose requires a paid plan. Free tier is one front photo only.',
          code: 'PREMIUM_REQUIRED',
        }, 403);
      }

      const pepper = Deno.env.get('DEVICE_ENTITLEMENT_SECRET')
        ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        ?? '';
      if (!deviceId || deviceId.length < 8) {
        return jsonResponse({ error: 'Device verification required.', code: 'DEVICE_REQUIRED' }, 400);
      }

      const deviceHash = await hashEntitlementValue(deviceId, pepper);
      const ip = clientIp(req);
      const ipHash = ip
        ? await hashEntitlementValue(ipBucket(ip), pepper)
        : null;

      const { data: entitled } = await admin.rpc('assert_free_scan_entitlement', {
        p_user_id: user.id,
        p_device_hash: deviceHash,
        p_ip_hash: ipHash,
        p_is_premium: false,
      });

      if (entitled !== true) {
        console.log('[analyze] free_scan_denied', { userId: user.id, reason: 'device_or_ip' });
        return jsonResponse({
          error: 'A free scan was already used on this device or network. Subscribe or sign in with the account that claimed it.',
          code: 'DEVICE_LIMITED',
        }, 403);
      }
    } else if (tier === 'starter') {
      if (scansToday >= STARTER_SCANS_PER_DAY) {
        return jsonResponse({
          error: 'Daily scan limit reached (1 per day on Starter). Upgrade to Pro for unlimited scans.',
          code: 'RATE_LIMITED',
        }, 429);
      }
    }

    const markFreeScanUsed = tier === 'free';

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

    // ── Increment scan counter only AFTER a successful analysis ────────────────
    // If GPT-4o errors or times out the user keeps their (single) free daily scan
    // instead of burning it on a failure. Written with the service role because the
    // RLS trigger blocks clients from touching scans_today. Retry-abuse is bounded
    // by this counter: once it's incremented the rate-limit check above blocks the
    // next call.
    const { error: gamError } = await admin.rpc('complete_scan_with_gamification', {
      p_user_id: user.id,
      p_scans_today: scansToday + 1,
      p_today: today,
      p_mark_free_scan_used: markFreeScanUsed,
    });
    if (gamError) {
      console.error('[analyze] gamification', gamError);
      await admin.from('profiles').update({
        scans_today: scansToday + 1,
        last_scan_reset_date: today,
        last_scan_date: new Date().toISOString(),
        ...(markFreeScanUsed ? { free_scan_used: true } : {}),
      }).eq('id', user.id);
    }

    return jsonResponse({ scanId, rawMeasurements });

  } catch (err: any) {
    console.error('[analyze]', err);
    return jsonResponse({ error: err?.message ?? 'Internal error' }, 500);
  }
});
