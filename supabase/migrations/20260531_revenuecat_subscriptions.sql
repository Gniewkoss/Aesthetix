-- RevenueCat-backed subscription source of truth (audit #1, #8).
--
-- profiles.is_premium remains the fast gate the rest of the app reads, but it is now
-- DERIVED from store-billing reality delivered by the RevenueCat webhook. This table
-- holds the richer subscription detail (plan, renewal, store) so "Restore" and the
-- manage-subscription UI don't have to fabricate anything (the old client fallback
-- invented a fake monthly plan — removed).
--
-- Written ONLY by the revenuecat Edge Function via the service role. Clients may read
-- their own row but can never write it (no insert/update/delete policy).
-- Apply with: supabase db push.

create table if not exists public.subscriptions (
  user_id            uuid        primary key references auth.users on delete cascade,
  store              text,                              -- APP_STORE | PLAY_STORE | STRIPE | ...
  product_id         text,
  entitlement        text,                              -- e.g. 'premium'
  status             text        not null default 'inactive',  -- active | inactive
  is_trial           boolean     not null default false,
  will_renew         boolean     not null default false,
  current_period_end timestamptz,
  -- Idempotency / ordering: RevenueCat retries webhooks and can deliver out of order.
  last_event_id      text,
  last_event_at      timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);
-- No insert/update/delete policies → only the service role (webhook) can mutate.
