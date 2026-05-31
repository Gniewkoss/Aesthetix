-- Security hardening (audit 2026-05-31, blockers #2, #3, #6):
--  • Stop clients self-granting Premium or resetting their daily scan counter (RLS).
--  • Give coach/chat a server-enforced per-user daily limit (cost-abuse / financial DoS).
--  • Add the scans.coaching_raw column the coach function already writes to.
-- Apply with: supabase db push  (or supabase migration up).

-- ── scans.coaching_raw ────────────────────────────────────────────────────────
-- The coach Edge Function updates scans.coaching_raw, but the column never existed
-- (the write silently no-ops). Add it.
alter table public.scans
  add column if not exists coaching_raw jsonb;

-- ── profiles: lock revenue/cost-critical columns ──────────────────────────────
-- Previously a single "for all" policy let any user UPDATE their own row, including
-- is_premium (→ free Premium forever) and scans_today (→ reset the rate limit and
-- run unlimited paid GPT-4o calls). The anon key is shipped in the bundle, so this
-- was trivially exploitable.
--
-- New model:
--   • SELECT: users read their own row (unchanged).
--   • INSERT: users may create their own row (full_name only; the signup trigger
--     also handles this).
--   • UPDATE: users may update their own row, BUT a BEFORE UPDATE trigger forces the
--     protected columns back to their previous values for any non-service_role
--     caller. So cosmetic edits (full_name) still work; is_premium / scan accounting
--     can only ever be changed by Edge Functions using the service-role key.
--
-- NOTE: xp / streak / last_scan_date remain client-writable for now (gamification is
-- still written from the app). Moving gamification server-side is a tracked follow-up;
-- those fields are vanity, not revenue or cost, so they are out of scope for this fix.

drop policy if exists "users can manage own profile" on public.profiles;

create policy "profiles select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The trigger function is intentionally NOT security definer: it must observe the
-- caller's effective role (current_user), which PostgREST sets via SET ROLE to
-- 'authenticated' for JWT callers and 'service_role' for the service key.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role' then
    return new;  -- Edge Functions (service role) may write anything.
  end if;

  -- Any other caller (authenticated user via the shipped anon key) cannot change
  -- monetization or rate-limit accounting. Silently pin them to the old values so
  -- legitimate updates to other columns (e.g. full_name) still succeed.
  new.is_premium           := old.is_premium;
  new.scans_today          := old.scans_today;
  new.last_scan_reset_date := old.last_scan_reset_date;
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute procedure public.protect_profile_columns();

-- ── ai_usage: per-user, per-feature daily counters ────────────────────────────
-- Append/increment-only usage ledger for AI Edge Functions (analyze already has its
-- own counter on profiles; coach and chat had NO limit at all). Written only by the
-- increment_ai_usage() SECURITY DEFINER function below — no direct client access.
create table if not exists public.ai_usage (
  user_id    uuid        not null references auth.users on delete cascade,
  feature    text        not null,
  usage_date date        not null default current_date,
  count      integer     not null default 0,
  primary key (user_id, feature, usage_date)
);

alter table public.ai_usage enable row level security;
-- No policies → clients cannot read or write directly. Only the SECURITY DEFINER
-- function (owner = postgres) and the service role can touch it.

-- Atomically increment today's counter for (user, feature) and report whether the
-- caller is still within the limit. Returns TRUE when the request is allowed.
-- The increment happens regardless (over-limit attempts still count), so a tight
-- retry loop can't slip extra calls through between read and write.
create or replace function public.increment_ai_usage(
  p_user    uuid,
  p_feature text,
  p_limit   integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage (user_id, feature, usage_date, count)
  values (p_user, p_feature, current_date, 1)
  on conflict (user_id, feature, usage_date)
  do update set count = public.ai_usage.count + 1
  returning count into new_count;

  return new_count <= p_limit;
end;
$$;

revoke all on function public.increment_ai_usage(uuid, text, integer) from public;
grant execute on function public.increment_ai_usage(uuid, text, integer) to service_role;

create index if not exists ai_usage_user_date on public.ai_usage (user_id, usage_date desc);
