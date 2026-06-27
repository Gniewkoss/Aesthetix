-- Free-scan device claims must survive account deletion (anti-abuse: delete + re-register).
-- A device that consumed its lifetime free scan stays blocked even after auth.users is erased.

alter table public.free_scan_device_claims
  drop constraint if exists free_scan_device_claims_user_id_fkey;

alter table public.free_scan_device_claims
  alter column user_id drop not null;

alter table public.free_scan_device_claims
  add constraint free_scan_device_claims_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

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
  ip_account_count integer;
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

  -- Hard gate: this physical device already consumed its lifetime free scan.
  if exists (
    select 1 from public.free_scan_device_claims where device_hash = p_device_hash
  ) then
    return false;
  end if;

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
