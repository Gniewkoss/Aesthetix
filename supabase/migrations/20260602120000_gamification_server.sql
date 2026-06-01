-- Server-authoritative gamification (xp, streak, share bonus).
-- Clients can no longer inflate xp/streak via profiles UPDATE.

alter table public.profiles
  add column if not exists last_share_bonus_date date;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role' then
    return new;
  end if;

  new.is_premium           := old.is_premium;
  new.scans_today          := old.scans_today;
  new.last_scan_reset_date := old.last_scan_reset_date;
  new.xp                   := old.xp;
  new.streak               := old.streak;
  new.last_scan_date       := old.last_scan_date;
  new.last_share_bonus_date := old.last_share_bonus_date;
  return new;
end;
$$;

-- Called by the analyze Edge Function after a successful vision response.
create or replace function public.complete_scan_with_gamification(
  p_user_id uuid,
  p_scans_today integer,
  p_today date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  add_xp integer := 50;
  new_xp integer;
  new_streak integer;
  last_day date;
begin
  select * into prof from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if prof.xp = 0 and prof.streak = 0 then
    add_xp := 100;
  end if;

  last_day := prof.last_scan_date::date;
  if last_day = p_today then
    new_streak := prof.streak;
  elsif last_day = (p_today - 1) then
    new_streak := prof.streak + 1;
  else
    new_streak := 1;
  end if;

  new_xp := prof.xp + add_xp;

  update public.profiles
  set
    scans_today = p_scans_today,
    last_scan_reset_date = p_today,
    last_scan_date = now(),
    xp = new_xp,
    streak = new_streak
  where id = p_user_id;

  return jsonb_build_object(
    'xp', new_xp,
    'streak', new_streak,
    'xp_awarded', add_xp
  );
end;
$$;

revoke all on function public.complete_scan_with_gamification(uuid, integer, date) from public;
grant execute on function public.complete_scan_with_gamification(uuid, integer, date) to service_role;

-- One share bonus per calendar day (30 XP).
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

  update public.profiles
  set
    xp = prof.xp + bonus,
    last_share_bonus_date = today
  where id = uid;

  return jsonb_build_object('awarded', true, 'xp', prof.xp + bonus, 'xp_awarded', bonus);
end;
$$;

revoke all on function public.claim_share_bonus() from public;
grant execute on function public.claim_share_bonus() to authenticated;
