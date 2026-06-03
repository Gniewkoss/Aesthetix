-- Lifetime free scan (1 per account) + device/IP anti-abuse for new-account farming.
-- Premium users bypass entitlement checks.

alter table public.profiles
  add column if not exists free_scan_used boolean not null default false;

-- First free scan claimed per installation (hashed device id from the app).
create table if not exists public.free_scan_device_claims (
  device_hash text primary key,
  user_id     uuid not null references auth.users on delete cascade,
  claimed_at  timestamptz not null default now()
);

-- Optional IP bucket (same /24-ish) — blocks many accounts behind one NAT.
create table if not exists public.free_scan_ip_claims (
  ip_hash text primary key,
  user_id uuid not null references auth.users on delete cascade,
  claimed_at timestamptz not null default now()
);

alter table public.free_scan_device_claims enable row level security;
alter table public.free_scan_ip_claims enable row level security;
-- No client policies — only service_role via Edge Functions.

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role' then
    return new;
  end if;

  new.is_premium            := old.is_premium;
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

-- Returns TRUE when a non-premium user may start a free scan (device + IP + profile).
create or replace function public.assert_free_scan_entitlement(
  p_user_id uuid,
  p_device_hash text,
  p_ip_hash text,
  p_is_premium boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  existing_user uuid;
begin
  if p_is_premium then
    return true;
  end if;

  if p_device_hash is null or length(trim(p_device_hash)) < 16 then
    return false;
  end if;

  select * into prof from public.profiles where id = p_user_id;
  if not found then
    return false;
  end if;

  if prof.free_scan_used then
    return false;
  end if;

  select user_id into existing_user
  from public.free_scan_device_claims
  where device_hash = p_device_hash;

  if found and existing_user <> p_user_id then
    return false;
  end if;

  if p_ip_hash is not null and length(trim(p_ip_hash)) >= 16 then
    select user_id into existing_user
    from public.free_scan_ip_claims
    where ip_hash = p_ip_hash;

    if found and existing_user <> p_user_id then
      return false;
    end if;
  end if;

  insert into public.free_scan_device_claims (device_hash, user_id)
  values (p_device_hash, p_user_id)
  on conflict (device_hash) do nothing;

  if p_ip_hash is not null and length(trim(p_ip_hash)) >= 16 then
    insert into public.free_scan_ip_claims (ip_hash, user_id)
    values (p_ip_hash, p_user_id)
    on conflict (ip_hash) do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.assert_free_scan_entitlement(uuid, text, text, boolean) from public;
grant execute on function public.assert_free_scan_entitlement(uuid, text, text, boolean) to service_role;

create or replace function public.complete_scan_with_gamification(
  p_user_id uuid,
  p_scans_today integer,
  p_today date,
  p_mark_free_scan_used boolean default false
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
    free_scan_used = case when p_mark_free_scan_used then true else free_scan_used end,
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

revoke all on function public.complete_scan_with_gamification(uuid, integer, date, boolean) from public;
grant execute on function public.complete_scan_with_gamification(uuid, integer, date, boolean) to service_role;
