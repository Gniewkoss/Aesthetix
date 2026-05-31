// Supabase Edge Function — revenuecat
// Receives RevenueCat server-to-server webhooks and makes the server the single
// source of truth for Premium. is_premium is set HERE (service role), never from the
// client — the RLS trigger on profiles blocks client writes to it.
//
// Setup:
//   1. supabase secrets set REVENUECAT_WEBHOOK_AUTH="<a long random secret>"
//   2. RevenueCat dashboard → Project → Integrations → Webhooks:
//        URL:  https://<project-ref>.supabase.co/functions/v1/revenuecat
//        Authorization header value: the SAME secret as above.
//   3. Deploy WITHOUT JWT verification (RC sends no Supabase JWT):
//        supabase functions deploy revenuecat --no-verify-jwt
//   4. In the app, log the user into RevenueCat with their Supabase id:
//        Purchases.logIn(supabaseUserId)  → so event.app_user_id == profiles.id
//
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'npm:@supabase/supabase-js@2';

// RevenueCat event types that grant access vs. revoke it. Anything not listed that
// still carries a future expiration is treated as active (e.g. CANCELLATION keeps
// access until the period ends; BILLING_ISSUE keeps it during the grace period).
const REVOKING_TYPES = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);
// Active but auto-renew is off → will_renew = false.
const NON_RENEWING_TYPES = new Set(['CANCELLATION', 'NON_RENEWING_PURCHASE', 'BILLING_ISSUE']);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RCEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  entitlement_ids?: string[];
  entitlement_id?: string;
  period_type?: string; // TRIAL | INTRO | NORMAL
  store?: string;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
  // TRANSFER only:
  transferred_from?: string[];
  transferred_to?: string[];
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Pick the Supabase user id (a UUID) from the various id fields RC may send. Anonymous
// RevenueCat ids look like "$RCAnonymousID:..." and are ignored.
function resolveUserId(...candidates: (string | string[] | undefined)[]): string | null {
  for (const c of candidates) {
    const list = Array.isArray(c) ? c : c ? [c] : [];
    for (const id of list) {
      if (id && UUID_RE.test(id)) return id;
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // ── Verify the shared secret RevenueCat sends in the Authorization header ──────
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expected) {
    console.error('[revenuecat] REVENUECAT_WEBHOOK_AUTH not configured');
    return json({ error: 'Webhook not configured' }, 500);
  }
  const auth = req.headers.get('Authorization') ?? '';
  // Accept either the raw secret or a "Bearer <secret>" form.
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (provided !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let event: RCEvent;
  try {
    const body = await req.json();
    event = body?.event ?? {};
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const type = event.type ?? 'UNKNOWN';

  // TEST events from the dashboard "Send test event" button — just acknowledge.
  if (type === 'TEST') return json({ ok: true, test: true });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── TRANSFER: move entitlement between app_user_ids ───────────────────────────
  // Revoke from the source id(s), then fall through to grant to the destination id.
  if (type === 'TRANSFER') {
    const fromIds = (event.transferred_from ?? []).filter((id) => UUID_RE.test(id));
    for (const fromId of fromIds) {
      await admin.from('profiles').update({ is_premium: false }).eq('id', fromId);
      await admin
        .from('subscriptions')
        .update({ status: 'inactive', will_renew: false, updated_at: new Date().toISOString() })
        .eq('user_id', fromId);
    }
  }

  // ── Resolve the Supabase user the event applies to ────────────────────────────
  const userId = resolveUserId(
    type === 'TRANSFER' ? event.transferred_to : undefined,
    event.app_user_id,
    event.original_app_user_id,
    event.aliases,
  );

  if (!userId) {
    // Anonymous purchase not yet linked to a Supabase account — ack so RC stops
    // retrying. The entitlement is reconciled on the next event after Purchases.logIn.
    console.warn('[revenuecat] no UUID app_user_id on event', type, event.app_user_id);
    return json({ ok: true, skipped: 'no_user_id' });
  }

  // ── Idempotency / ordering ────────────────────────────────────────────────────
  // RC retries deliveries and can deliver out of order. Skip duplicates (same event
  // id) and stale events (older than what we've already applied).
  const eventAtMs = event.event_timestamp_ms ?? Date.now();
  const eventAt = new Date(eventAtMs).toISOString();

  const { data: existing } = await admin
    .from('subscriptions')
    .select('last_event_id, last_event_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.last_event_id && existing.last_event_id === event.id) {
    return json({ ok: true, duplicate: true });
  }
  if (existing?.last_event_at && new Date(existing.last_event_at).getTime() > eventAtMs) {
    return json({ ok: true, stale: true });
  }

  // ── Derive premium state from the event ───────────────────────────────────────
  const expirationMs = event.expiration_at_ms ?? null;
  const hasFutureAccess = expirationMs == null || expirationMs > Date.now();
  const isActive = !REVOKING_TYPES.has(type) && hasFutureAccess;
  const willRenew = isActive && !NON_RENEWING_TYPES.has(type);

  // ── Persist: subscriptions detail + the is_premium gate ───────────────────────
  const subError = (
    await admin.from('subscriptions').upsert(
      {
        user_id: userId,
        store: event.store ?? null,
        product_id: event.product_id ?? null,
        entitlement: event.entitlement_id ?? event.entitlement_ids?.[0] ?? null,
        status: isActive ? 'active' : 'inactive',
        is_trial: event.period_type === 'TRIAL',
        will_renew: willRenew,
        current_period_end: expirationMs ? new Date(expirationMs).toISOString() : null,
        last_event_id: event.id ?? null,
        last_event_at: eventAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  ).error;

  const profileError = (
    await admin.from('profiles').update({ is_premium: isActive }).eq('id', userId)
  ).error;

  if (subError || profileError) {
    console.error('[revenuecat] write failed', { type, userId, subError, profileError });
    // 500 → RevenueCat will retry, which our idempotency guard handles safely.
    return json({ error: 'Persistence failed' }, 500);
  }

  return json({ ok: true, type, userId, isActive });
});
