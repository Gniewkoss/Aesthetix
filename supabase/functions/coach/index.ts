// Supabase Edge Function — coach
// Accepts a pre-built coaching prompt (assembled client-side from scoring results)
// and returns AI coaching narrative JSON. OpenAI key stays server-side.
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
