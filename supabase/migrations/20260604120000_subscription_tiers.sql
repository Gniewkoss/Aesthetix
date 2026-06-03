-- Three paid tiers: starter (1 scan/day), pro (unlimited), max (unlimited + AI coach).

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_subscription_tier_check;

alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('free', 'starter', 'pro', 'max'));

-- Backfill from active subscriptions when possible.
update public.profiles p
set subscription_tier = case
  when not p.is_premium then 'free'
  when s.product_id ilike '%week%' then 'starter'
  when s.product_id ilike '%max%' then 'max'
  when s.product_id ilike '%month%' then 'pro'
  when p.is_premium then 'pro'
  else 'free'
end
from public.subscriptions s
where s.user_id = p.id and s.status = 'active';

update public.profiles
set subscription_tier = 'pro'
where is_premium = true and subscription_tier = 'free';

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role' then
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
