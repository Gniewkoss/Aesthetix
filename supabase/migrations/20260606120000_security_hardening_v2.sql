-- Security hardening v2 (2026-06-06):
--  • Tighten scans RLS: no client INSERT/DELETE (Edge Functions use service_role).
--  • Allow SECURITY DEFINER RPCs (e.g. claim_share_bonus) to update gamification fields.

-- ── scans: replace blanket FOR ALL policy ─────────────────────────────────────
drop policy if exists "users can manage own scans" on public.scans;

create policy "scans select own"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "scans update own"
  on public.scans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT and DELETE are service_role only (analyze Edge Function creates rows).

-- ── profiles: trusted writes from SECURITY DEFINER RPCs ───────────────────────
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role'
     or current_setting('app.trusted_profile_write', true) = 'true' then
    return new;
  end if;

  new.is_premium            := old.is_premium;
  new.subscription_tier     := old.subscription_tier;
  new.scans_today           := old.scans_today;
  new.last_scan_reset_date  := old.last_scan_reset_date;
  new.free_scan_used        := old.free_scan_used;
  new.xp                    := old.xp;
  new.streak                := old.streak;
  new.last_scan_date        := old.last_scan_date;
  new.last_share_bonus_date := old.last_share_bonus_date;
  return new;
end;
$$;

-- Fix claim_share_bonus: set trusted flag so the trigger allows XP updates.
create or replace function public.claim_share_bonus()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prof public.profiles%rowtype;
  today date := current_date;
  bonus integer := 30;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into prof from public.profiles where id = uid for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if prof.last_share_bonus_date = today then
    return jsonb_build_object('awarded', false, 'xp', prof.xp, 'reason', 'already_claimed');
  end if;

  perform set_config('app.trusted_profile_write', 'true', true);

  update public.profiles
  set
    xp = prof.xp + bonus,
    last_share_bonus_date = today
  where id = uid;

  return jsonb_build_object('awarded', true, 'xp', prof.xp + bonus, 'xp_awarded', bonus);
end;
$$;
