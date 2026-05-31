// Supabase Edge Function — chat
// Multi-turn AI coach chat. Accepts conversation history + a system context string
// built client-side from the user's analysis. OpenAI key stays server-side.
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Per-user daily message cap (financial-DoS guard) — one GPT-4o call per request.
const FREE_CHAT_PER_DAY = 20;
const PREMIUM_CHAT_PER_DAY = 200;

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
    const { messages, systemContext } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      systemContext: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'Messages array is required' }, 400);
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

    const limit = profile?.is_premium ? PREMIUM_CHAT_PER_DAY : FREE_CHAT_PER_DAY;
    const { data: allowed } = await admin.rpc('increment_ai_usage', {
      p_user: user.id,
      p_feature: 'chat',
      p_limit: limit,
    });

    if (allowed === false) {
      return jsonResponse({ error: 'Daily message limit reached. Upgrade to Premium for more.', code: 'RATE_LIMITED' }, 429);
    }

    // Cap history to last 20 turns to stay within token budget
    const recentMessages = messages.slice(-20);

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: systemContext ?? 'You are an expert physique coach. Give concise, actionable advice.',
        },
        ...recentMessages,
      ],
    });

    const message = response.choices[0]?.message?.content ?? '';
    return jsonResponse({ message });

  } catch (err: any) {
    console.error('[chat]', err);
    return jsonResponse({ error: err?.message ?? 'Internal error' }, 500);
  }
});
