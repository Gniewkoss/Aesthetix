-- Fix: free-tier IP gate was a hard 1:1 block. Behind CGNAT / corporate NAT many
-- distinct legitimate users share one /24 bucket, so the FIRST genuine new user on a
-- "claimed" IP was denied their first free scan (false positive → paywall on scan #1).
--
-- New behaviour: device_hash stays a hard gate (stable per-installation). IP becomes a
-- soft anti-farming threshold — deny only when an abnormal number of distinct accounts
-- claim free scans from the same IP bucket.

-- The original table had ip_hash as PRIMARY KEY, so it could only ever store ONE account
-- per IP — incompatible with counting distinct accounts. Switch to one row per
-- (ip_hash, user_id) so the threshold check below is meaningful.
alter table public.free_scan_ip_claims
  drop constraint if exists free_scan_ip_claims_pkey;

alter table public.free_scan_ip_claims
  add column if not exists id bigint generated always as identity;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'free_scan_ip_claims_pkey'
  ) then
    alter table public.free_scan_ip_claims add primary key (id);
  end if;
end $$;

create unique index if not exists free_scan_ip_claims_ip_user_uniq
  on public.free_scan_ip_claims (ip_hash, user_id);

create index if not exists free_scan_ip_claims_ip_idx
  on public.free_scan_ip_claims (ip_hash);

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
  ip_account_count integer;
  -- Distinct accounts allowed to claim a free scan from one IP bucket before we treat
  -- it as farming. Tuned for shared CGNAT/NAT; raise if false positives appear.
  ip_abuse_threshold constant integer := 5;
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

  -- Hard gate: this physical installation already claimed a free scan (another account).
  select user_id into existing_user
  from public.free_scan_device_claims
  where device_hash = p_device_hash;

  if found and existing_user <> p_user_id then
    return false;
  end if;

  -- Soft gate: only block the IP bucket once too many distinct accounts have claimed
  -- from it (farming), instead of blocking the first honest user behind shared NAT.
  if p_ip_hash is not null and length(trim(p_ip_hash)) >= 16 then
    select count(distinct user_id) into ip_account_count
    from public.free_scan_ip_claims
    where ip_hash = p_ip_hash
      and user_id <> p_user_id;

    if ip_account_count >= ip_abuse_threshold then
      return false;
    end if;
  end if;

  insert into public.free_scan_device_claims (device_hash, user_id)
  values (p_device_hash, p_user_id)
  on conflict (device_hash) do nothing;

  if p_ip_hash is not null and length(trim(p_ip_hash)) >= 16 then
    insert into public.free_scan_ip_claims (ip_hash, user_id)
    values (p_ip_hash, p_user_id)
    on conflict (ip_hash, user_id) do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.assert_free_scan_entitlement(uuid, text, text, boolean) from public;
grant execute on function public.assert_free_scan_entitlement(uuid, text, text, boolean) to service_role;
