-- Promo profile: Pro/Max + XP/streak
-- SQL Editor runs as "postgres"; trigger protect_profile_columns blocks is_premium
-- unless current_user is service_role. Disable trigger for this one-off seed.

alter table public.profiles disable trigger protect_profile_columns;

update public.profiles
set
  full_name = 'Alex',
  is_premium = true,
  subscription_tier = 'max',
  free_scan_used = true,
  xp = 4200,
  streak = 14,
  last_scan_date = now(),
  scans_today = 0,
  last_scan_reset_date = current_date
where id = 'd0fbfb36-8616-4529-9aef-24cd19150792';

alter table public.profiles enable trigger protect_profile_columns;

-- Verify (should show max / true / 4200 / 14)
select subscription_tier, is_premium, xp, streak
from public.profiles
where id = 'd0fbfb36-8616-4529-9aef-24cd19150792';
