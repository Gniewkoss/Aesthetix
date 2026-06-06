-- Apple App Review demo account: Premium (max tier) + sample scan history
--
-- BEFORE running:
--   1. Create account in the app (Create Account tab):
--        Email:    apple.review@aesthetix.online
--        Password: (your choice — use the same in App Store Connect → App Review)
--   2. Supabase Dashboard → SQL Editor → paste this file → Run
--
-- Safe to re-run (idempotent for apple_review_* scans).

do $$
declare
  v_email constant text := 'apple.review@aesthetix.online';
  v_user_id uuid;
  v_period_end timestamptz := now() + interval '1 year';
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email);

  if v_user_id is null then
    raise exception 'User % not found. Register in the app first, then re-run.', v_email;
  end if;

  -- Subscription row (mirrors RevenueCat webhook shape)
  insert into public.subscriptions (
    user_id,
    store,
    product_id,
    entitlement,
    status,
    is_trial,
    will_renew,
    current_period_end,
    last_event_id,
    last_event_at,
    updated_at
  )
  values (
    v_user_id,
    'APP_STORE',
    'aesthetix_monthly_max',
    'max',
    'active',
    false,
    true,
    v_period_end,
    'apple_review_seed',
    now(),
    now()
  )
  on conflict (user_id) do update set
    store              = excluded.store,
    product_id         = excluded.product_id,
    entitlement        = excluded.entitlement,
    status             = excluded.status,
    is_trial           = excluded.is_trial,
    will_renew         = excluded.will_renew,
    current_period_end = excluded.current_period_end,
    last_event_id      = excluded.last_event_id,
    last_event_at      = excluded.last_event_at,
    updated_at         = excluded.updated_at;

  -- profiles.is_premium is blocked by trigger unless we bypass it briefly
  alter table public.profiles disable trigger protect_profile_columns;

  update public.profiles
  set
    full_name            = coalesce(full_name, 'Apple Review'),
    is_premium           = true,
    subscription_tier    = 'max',
    free_scan_used       = true,
    xp                   = 2400,
    streak               = 7,
    last_scan_date       = now(),
    scans_today          = 0,
    last_scan_reset_date = current_date
  where id = v_user_id;

  alter table public.profiles enable trigger protect_profile_columns;

  delete from public.scans
  where user_id = v_user_id
    and analysis->>'id' in ('apple_review_scan_1', 'apple_review_scan_2');

  insert into public.scans (user_id, analysis, created_at)
  values
    (
      v_user_id,
      '{
        "id": "apple_review_scan_1",
        "imageUris": [],
        "visibleBodyParts": ["chest", "shoulders", "arms", "abs", "waist", "traps", "forearms"],
        "notVisibleBodyParts": ["back", "legs", "glutes"],
        "overallScore": 74,
        "bodyFat": 16,
        "bodyFatRange": "14-18%",
        "symmetryScore": 78,
        "vTaperScore": 70,
        "muscularity": 73,
        "aestheticsScore": 75,
        "proportionsScore": 80,
        "postureScore": 88,
        "athleticismScore": 79,
        "summary": "Solid upper body development with above-average V-taper and strong postural alignment. Core conditioning is the primary limiting factor — reducing body fat would unlock significant aesthetic gains.",
        "glowUpPrediction": "With a modest caloric deficit over 12–16 weeks, you could reach 10–12% body fat and push conditioning above 85.",
        "predictedPotentialScore": 89,
        "priorityAreas": ["abs", "forearms"],
        "muscleGroups": {
          "shoulders": {"visible": true, "score": 80, "strengths": ["Good shoulder roundness"], "weaknesses": ["Rear delts volume"], "recommendations": ["Face pulls"]},
          "chest": {"visible": true, "score": 76, "strengths": ["Good chest mass"], "weaknesses": ["Upper chest detail"], "recommendations": ["Incline press"]},
          "biceps": {"visible": true, "score": 77, "strengths": ["Good arm thickness"], "weaknesses": [], "recommendations": ["Hammer curls"]},
          "triceps": {"visible": true, "score": 77, "strengths": ["Solid thickness"], "weaknesses": [], "recommendations": ["Rope pushdowns"]},
          "back": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "traps": {"visible": true, "score": 71, "strengths": ["Visible development"], "weaknesses": [], "recommendations": ["Face pulls"]},
          "abs": {"visible": true, "score": 68, "strengths": ["Good structure"], "weaknesses": ["Definition limited by BF"], "recommendations": ["Cut to 12% BF"]},
          "forearms": {"visible": true, "score": 69, "strengths": [], "weaknesses": ["Mass below upper arm"], "recommendations": ["Farmer carries"]},
          "quads": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "calves": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "glutes": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []}
        },
        "issuesDetected": [{"id": "issue_bf", "title": "Body Fat Above Aesthetic Threshold", "description": "Reducing body fat would sharpen definition.", "severity": "medium", "category": "composition"}],
        "improvementPlan": [{"priority": 1, "area": "Body Composition", "action": "Moderate caloric deficit, high protein", "timeframe": "12 weeks", "expectedResult": "Visible abs"}],
        "dietaryRecommendations": [{"category": "Protein", "recommendation": "170–190g protein daily", "rationale": "Preserve muscle during a cut."}],
        "createdAt": "2026-05-22T10:00:00.000Z"
      }'::jsonb,
      now() - interval '14 days'
    ),
    (
      v_user_id,
      '{
        "id": "apple_review_scan_2",
        "imageUris": [],
        "visibleBodyParts": ["chest", "shoulders", "arms", "abs", "waist", "traps", "forearms"],
        "notVisibleBodyParts": ["back", "legs", "glutes"],
        "overallScore": 78,
        "bodyFat": 14,
        "bodyFatRange": "13-17%",
        "symmetryScore": 82,
        "vTaperScore": 74,
        "muscularity": 77,
        "aestheticsScore": 79,
        "proportionsScore": 80,
        "postureScore": 91,
        "athleticismScore": 79,
        "summary": "Solid upper body development with above-average V-taper and strong postural alignment. Core conditioning is the primary limiting factor — reducing body fat would unlock significant aesthetic gains.",
        "glowUpPrediction": "Realistic 6-month overall score projection: 85–88.",
        "predictedPotentialScore": 91,
        "priorityAreas": ["abs", "forearms", "traps"],
        "muscleGroups": {
          "shoulders": {"visible": true, "score": 82, "strengths": ["Strong V-taper frame"], "weaknesses": ["Rear delts"], "recommendations": ["Face pulls 3x15"]},
          "chest": {"visible": true, "score": 78, "strengths": ["Good chest mass"], "weaknesses": ["Inner-chest detail"], "recommendations": ["Incline press"]},
          "biceps": {"visible": true, "score": 78, "strengths": ["Good arm thickness"], "weaknesses": [], "recommendations": ["Incline curls"]},
          "triceps": {"visible": true, "score": 78, "strengths": ["Solid thickness"], "weaknesses": [], "recommendations": ["Overhead extensions"]},
          "back": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "traps": {"visible": true, "score": 72, "strengths": ["Visible trap development"], "weaknesses": [], "recommendations": ["Y-raises"]},
          "abs": {"visible": true, "score": 70, "strengths": ["Good ab structure"], "weaknesses": ["Definition limited by BF"], "recommendations": ["Weighted crunches"]},
          "forearms": {"visible": true, "score": 70, "strengths": ["Decent proportion"], "weaknesses": [], "recommendations": ["Reverse curls"]},
          "quads": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "calves": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "glutes": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []}
        },
        "issuesDetected": [{"id": "issue_bf", "title": "Body Fat Above Aesthetic Threshold", "description": "Reducing body fat would sharpen definition.", "severity": "medium", "category": "composition"}],
        "improvementPlan": [{"priority": 1, "area": "Body Composition", "action": "300–400 kcal deficit, high protein", "timeframe": "12–16 weeks", "expectedResult": "Lower BF, visible abs"}],
        "dietaryRecommendations": [{"category": "Protein", "recommendation": "175–200g protein daily", "rationale": "Preserve muscle during a cut."}],
        "createdAt": "2026-06-05T10:00:00.000Z"
      }'::jsonb,
      now()
    );

  raise notice 'Apple review seed OK for user % (%)', v_email, v_user_id;
end $$;

-- Verify
select
  u.email,
  p.subscription_tier,
  p.is_premium,
  p.xp,
  p.streak,
  s.status as sub_status,
  s.product_id,
  s.current_period_end,
  (select count(*) from public.scans sc where sc.user_id = u.id) as scan_count
from auth.users u
join public.profiles p on p.id = u.id
left join public.subscriptions s on s.user_id = u.id
where lower(u.email) = lower('apple.review@aesthetix.online');
