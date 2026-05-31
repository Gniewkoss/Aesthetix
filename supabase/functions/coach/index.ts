// Supabase Edge Function — coach
// Accepts a pre-built coaching prompt (assembled client-side from scoring results)
// and returns AI coaching narrative JSON. OpenAI key stays server-side.
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Per-user daily cap on coaching generations (financial-DoS guard). Coaching is
// normally one call per scan, so these are generous; they only stop runaway loops.
const FREE_COACH_PER_DAY = 5;
const PREMIUM_COACH_PER_DAY = 100;

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { prompt, scanId } = body as { prompt: string; scanId?: string };

    if (!prompt || typeof prompt !== 'string' || prompt.length < 100) {
      return jsonResponse({ error: 'Valid prompt is required' }, 400);
    }

    // ── Rate limit (service role: ai_usage + the increment RPC are not client-accessible) ──
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile } = await admin
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    const limit = profile?.is_premium ? PREMIUM_COACH_PER_DAY : FREE_COACH_PER_DAY;
    const { data: allowed } = await admin.rpc('increment_ai_usage', {
      p_user: user.id,
      p_feature: 'coach',
      p_limit: limit,
    });

    if (allowed === false) {
      return jsonResponse({ error: 'Daily coaching limit reached.', code: 'RATE_LIMITED' }, 429);
    }

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return jsonResponse({ error: 'No coaching response' }, 500);

    const coaching = JSON.parse(content);

    // Update the scan record with the scanId from the analyze call (if provided)
    if (scanId) {
      await supabase
        .from('scans')
        .update({ coaching_raw: coaching })
        .eq('id', scanId)
        .eq('user_id', user.id);
    }

    return jsonResponse(coaching);

  } catch (err: any) {
    console.error('[coach]', err);
    return jsonResponse({ error: err?.message ?? 'Internal error' }, 500);
  }
});
