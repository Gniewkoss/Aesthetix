-- Demo account: scan history across score tiers (20–30 → 90–100)
--
-- BEFORE running:
--   1. Account must already exist:
--        Email: demo@aesthetix.online
--   2. Supabase Dashboard → SQL Editor → paste this file → Run
--
-- Safe to re-run (deletes only demo_scan_* rows first).

do $$
declare
  v_email constant text := 'demo@aesthetix.online';
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email);

  if v_user_id is null then
    raise exception 'User % not found. Create the account first, then re-run.', v_email;
  end if;

  delete from public.scans
  where user_id = v_user_id
    and analysis->>'id' like 'demo_scan_%';

  insert into public.scans (user_id, analysis, created_at)
  values
    -- Tier 1: słabe (~20–30)
    (
      v_user_id,
      '{
        "id": "demo_scan_t1",
        "imageUris": [],
        "visibleBodyParts": ["chest", "shoulders", "arms", "abs", "waist", "traps", "forearms"],
        "notVisibleBodyParts": ["back", "legs", "glutes"],
        "overallScore": 27,
        "bodyFat": 31,
        "bodyFatRange": "28-32%",
        "symmetryScore": 28,
        "vTaperScore": 22,
        "muscularity": 24,
        "aestheticsScore": 23,
        "proportionsScore": 30,
        "postureScore": 42,
        "athleticismScore": 26,
        "summary": "Early baseline scan. High body fat and limited visible muscle development are the main limiting factors. Posture and core engagement need attention before aesthetics can improve meaningfully.",
        "glowUpPrediction": "With consistent resistance training and a moderate caloric deficit over 6–9 months, a realistic overall score target is 55–65.",
        "predictedPotentialScore": 68,
        "priorityAreas": ["abs", "shoulders", "chest"],
        "muscleGroups": {
          "shoulders": {"visible": true, "score": 28, "strengths": [], "weaknesses": ["Narrow shoulder frame", "Minimal delt development"], "recommendations": ["Overhead press 3x/week", "Lateral raises"]},
          "chest": {"visible": true, "score": 26, "strengths": [], "weaknesses": ["Low chest mass", "No visible definition"], "recommendations": ["Push-ups", "Bench press"]},
          "biceps": {"visible": true, "score": 25, "strengths": [], "weaknesses": ["Thin arms"], "recommendations": ["Hammer curls", "Chin-ups"]},
          "triceps": {"visible": true, "score": 24, "strengths": [], "weaknesses": ["Minimal arm thickness"], "recommendations": ["Tricep dips", "Pushdowns"]},
          "back": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "traps": {"visible": true, "score": 30, "strengths": [], "weaknesses": ["Flat upper back"], "recommendations": ["Face pulls", "Rows"]},
          "abs": {"visible": true, "score": 22, "strengths": [], "weaknesses": ["High body fat obscures core", "Weak core engagement"], "recommendations": ["Planks", "Caloric deficit"]},
          "forearms": {"visible": true, "score": 27, "strengths": [], "weaknesses": ["Underdeveloped"], "recommendations": ["Farmer carries"]},
          "quads": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "calves": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "glutes": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []}
        },
        "issuesDetected": [
          {"id": "issue_bf_high", "title": "Elevated Body Fat", "description": "Body fat is well above the aesthetic threshold, limiting all visible muscle scores.", "severity": "high", "category": "composition"},
          {"id": "issue_muscle", "title": "Low Muscle Development", "description": "Visible muscle groups score below average across the board.", "severity": "high", "category": "muscle"},
          {"id": "issue_posture", "title": "Postural Alignment", "description": "Forward shoulder posture detected — address with mobility work.", "severity": "medium", "category": "posture"}
        ],
        "improvementPlan": [
          {"priority": 1, "area": "Body Composition", "action": "Moderate caloric deficit, 150g+ protein daily", "timeframe": "16 weeks", "expectedResult": "Drop 4–6% body fat"},
          {"priority": 2, "area": "Foundation Strength", "action": "Full-body program 3x/week", "timeframe": "12 weeks", "expectedResult": "Build base muscle mass"}
        ],
        "dietaryRecommendations": [
          {"category": "Protein", "recommendation": "130–150g protein daily", "rationale": "Support muscle retention during fat loss."},
          {"category": "Calories", "recommendation": "300–400 kcal daily deficit", "rationale": "Sustainable fat loss without muscle loss."}
        ],
        "createdAt": "2025-12-01T10:00:00.000Z"
      }'::jsonb,
      now() - interval '180 days'
    ),

    -- Tier 2: lepsze (~40–50)
    (
      v_user_id,
      '{
        "id": "demo_scan_t2",
        "imageUris": [],
        "visibleBodyParts": ["chest", "shoulders", "arms", "abs", "waist", "traps", "forearms"],
        "notVisibleBodyParts": ["back", "legs", "glutes"],
        "overallScore": 46,
        "bodyFat": 24,
        "bodyFatRange": "22-26%",
        "symmetryScore": 48,
        "vTaperScore": 40,
        "muscularity": 44,
        "aestheticsScore": 42,
        "proportionsScore": 50,
        "postureScore": 58,
        "athleticismScore": 45,
        "summary": "Noticeable progress from baseline. Some upper-body muscle is emerging but body fat still masks definition. Shoulders and chest are starting to show shape — keep building consistency.",
        "glowUpPrediction": "Continuing current training with a tighter diet could push overall score to 65–72 within 4–5 months.",
        "predictedPotentialScore": 78,
        "priorityAreas": ["abs", "chest", "shoulders"],
        "muscleGroups": {
          "shoulders": {"visible": true, "score": 48, "strengths": ["Early delt shape visible"], "weaknesses": ["Still narrow frame", "Rear delts undeveloped"], "recommendations": ["Lateral raises 4x15", "Face pulls"]},
          "chest": {"visible": true, "score": 45, "strengths": ["Some chest thickness"], "weaknesses": ["No separation at current BF"], "recommendations": ["Incline press", "Dumbbell flyes"]},
          "biceps": {"visible": true, "score": 44, "strengths": ["Slight arm fill"], "weaknesses": ["Peak not visible"], "recommendations": ["Hammer curls", "Barbell curls"]},
          "triceps": {"visible": true, "score": 43, "strengths": [], "weaknesses": ["Arms still thin overall"], "recommendations": ["Close-grip bench", "Rope pushdowns"]},
          "back": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "traps": {"visible": true, "score": 47, "strengths": ["Basic trap outline"], "weaknesses": ["Limited thickness"], "recommendations": ["Shrugs", "Rows"]},
          "abs": {"visible": true, "score": 38, "strengths": [], "weaknesses": ["BF too high for definition", "Core strength improving slowly"], "recommendations": ["Cable crunches", "Cut to 18% BF"]},
          "forearms": {"visible": true, "score": 42, "strengths": [], "weaknesses": ["Lag behind upper arms"], "recommendations": ["Reverse curls", "Wrist curls"]},
          "quads": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "calves": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "glutes": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []}
        },
        "issuesDetected": [
          {"id": "issue_bf", "title": "Body Fat Above Aesthetic Threshold", "description": "Still above the range where muscle definition becomes visible.", "severity": "medium", "category": "composition"},
          {"id": "issue_symmetry", "title": "Left-Right Imbalance", "description": "Slight asymmetry in shoulder height — monitor with unilateral work.", "severity": "low", "category": "symmetry"}
        ],
        "improvementPlan": [
          {"priority": 1, "area": "Body Composition", "action": "250–350 kcal deficit, track macros", "timeframe": "12 weeks", "expectedResult": "Reach 20% body fat"},
          {"priority": 2, "area": "Upper Body Volume", "action": "Push/pull split 4x/week", "timeframe": "8 weeks", "expectedResult": "Chest and shoulder scores +8–10"}
        ],
        "dietaryRecommendations": [
          {"category": "Protein", "recommendation": "160–175g protein daily", "rationale": "Fuel muscle growth during recomposition."}
        ],
        "createdAt": "2026-01-20T10:00:00.000Z"
      }'::jsonb,
      now() - interval '120 days'
    ),

    -- Tier 3: średnie (~60–70)
    (
      v_user_id,
      '{
        "id": "demo_scan_t3",
        "imageUris": [],
        "visibleBodyParts": ["chest", "shoulders", "arms", "abs", "waist", "traps", "forearms"],
        "notVisibleBodyParts": ["back", "legs", "glutes"],
        "overallScore": 66,
        "bodyFat": 19,
        "bodyFatRange": "17-21%",
        "symmetryScore": 68,
        "vTaperScore": 62,
        "muscularity": 65,
        "aestheticsScore": 63,
        "proportionsScore": 70,
        "postureScore": 74,
        "athleticismScore": 67,
        "summary": "Solid intermediate physique. Upper body shows decent development with a developing V-taper. Core definition is emerging but still the main bottleneck — a focused cut would unlock the next tier.",
        "glowUpPrediction": "A 10–12 week cut to 14–15% body fat could raise overall score to 78–82.",
        "predictedPotentialScore": 86,
        "priorityAreas": ["abs", "forearms", "traps"],
        "muscleGroups": {
          "shoulders": {"visible": true, "score": 68, "strengths": ["Visible delt roundness", "Improving V-taper"], "weaknesses": ["Rear delts need volume"], "recommendations": ["Face pulls 3x15", "Rear delt rows"]},
          "chest": {"visible": true, "score": 65, "strengths": ["Good chest mass building"], "weaknesses": ["Upper chest lagging"], "recommendations": ["Incline press", "Cable crossovers"]},
          "biceps": {"visible": true, "score": 64, "strengths": ["Decent arm thickness"], "weaknesses": ["Peak needs lower BF"], "recommendations": ["Incline curls", "Hammer curls"]},
          "triceps": {"visible": true, "score": 63, "strengths": ["Arm thickness improving"], "weaknesses": ["Lateral head separation"], "recommendations": ["Overhead extensions", "Rope pushdowns"]},
          "back": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "traps": {"visible": true, "score": 62, "strengths": ["Visible trap development"], "weaknesses": ["Mid/lower traps underdeveloped"], "recommendations": ["Face pulls", "Y-raises"]},
          "abs": {"visible": true, "score": 58, "strengths": ["Core structure visible"], "weaknesses": ["Definition limited by BF"], "recommendations": ["Cut to 14% BF", "Weighted crunches"]},
          "forearms": {"visible": true, "score": 60, "strengths": ["Proportion improving"], "weaknesses": ["Still below upper arm"], "recommendations": ["Reverse curls", "Farmer carries"]},
          "quads": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "calves": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "glutes": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []}
        },
        "issuesDetected": [
          {"id": "issue_bf", "title": "Body Fat Above Aesthetic Threshold", "description": "Reducing body fat would sharpen definition and raise aesthetics score.", "severity": "medium", "category": "composition"}
        ],
        "improvementPlan": [
          {"priority": 1, "area": "Body Composition", "action": "300 kcal deficit, high protein", "timeframe": "10 weeks", "expectedResult": "Visible ab outline at 15% BF"}
        ],
        "dietaryRecommendations": [
          {"category": "Protein", "recommendation": "170–185g protein daily", "rationale": "Preserve muscle during cut phase."}
        ],
        "createdAt": "2026-03-10T10:00:00.000Z"
      }'::jsonb,
      now() - interval '75 days'
    ),

    -- Tier 4: dobre (~70–90)
    (
      v_user_id,
      '{
        "id": "demo_scan_t4",
        "imageUris": [],
        "visibleBodyParts": ["chest", "shoulders", "arms", "abs", "waist", "traps", "forearms"],
        "notVisibleBodyParts": ["back", "legs", "glutes"],
        "overallScore": 82,
        "bodyFat": 14,
        "bodyFatRange": "12-16%",
        "symmetryScore": 84,
        "vTaperScore": 78,
        "muscularity": 80,
        "aestheticsScore": 81,
        "proportionsScore": 83,
        "postureScore": 89,
        "athleticismScore": 80,
        "summary": "Strong upper body development with above-average V-taper and excellent postural alignment. Chest and shoulders score well. Core conditioning is the primary remaining lever — dropping another 2–3% body fat would push aesthetics into the elite range.",
        "glowUpPrediction": "With a modest caloric deficit over 8–10 weeks, you could reach 10–12% body fat and push overall score to 88–92.",
        "predictedPotentialScore": 93,
        "priorityAreas": ["abs", "forearms"],
        "muscleGroups": {
          "shoulders": {"visible": true, "score": 85, "strengths": ["Strong V-taper frame", "Good 3D delt roundness"], "weaknesses": ["Rear delts slightly behind front"], "recommendations": ["Face pulls 3x15", "Rear delt rows"]},
          "chest": {"visible": true, "score": 81, "strengths": ["Good chest mass and thickness", "Decent upper chest"], "weaknesses": ["Inner-chest detail at current BF"], "recommendations": ["Incline press", "Cable crossovers"]},
          "biceps": {"visible": true, "score": 80, "strengths": ["Good arm thickness"], "weaknesses": ["Peak sharpens with lower BF"], "recommendations": ["Incline curls", "Hammer curls"]},
          "triceps": {"visible": true, "score": 79, "strengths": ["Solid arm thickness"], "weaknesses": ["Horseshoe separation needs lower BF"], "recommendations": ["Overhead extensions", "Rope pushdowns"]},
          "back": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "traps": {"visible": true, "score": 76, "strengths": ["Visible trap development"], "weaknesses": ["Mid/lower traps"], "recommendations": ["Face pulls", "Y-raises"]},
          "abs": {"visible": true, "score": 74, "strengths": ["Good ab structure", "Obliques visible"], "weaknesses": ["Full six-pack needs lower BF"], "recommendations": ["Cut to 11% BF", "Weighted crunches"]},
          "forearms": {"visible": true, "score": 73, "strengths": ["Decent proportion", "Some venous visibility"], "weaknesses": ["Mass slightly below upper arm"], "recommendations": ["Reverse curls", "Farmer carries"]},
          "quads": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "calves": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "glutes": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []}
        },
        "issuesDetected": [
          {"id": "issue_bf", "title": "Body Fat Above Aesthetic Threshold", "description": "Reducing body fat 2–3% would sharpen definition significantly.", "severity": "low", "category": "composition"}
        ],
        "improvementPlan": [
          {"priority": 1, "area": "Body Composition", "action": "200–300 kcal deficit, high protein", "timeframe": "8 weeks", "expectedResult": "Full ab visibility at 11–12% BF"}
        ],
        "dietaryRecommendations": [
          {"category": "Protein", "recommendation": "180–200g protein daily", "rationale": "Preserve muscle during final cut phase."}
        ],
        "createdAt": "2026-05-05T10:00:00.000Z"
      }'::jsonb,
      now() - interval '30 days'
    ),

    -- Tier 5: elitarne (~90–100)
    (
      v_user_id,
      '{
        "id": "demo_scan_t5",
        "imageUris": [],
        "visibleBodyParts": ["chest", "shoulders", "arms", "abs", "waist", "traps", "forearms"],
        "notVisibleBodyParts": ["back", "legs", "glutes"],
        "overallScore": 95,
        "bodyFat": 9,
        "bodyFatRange": "8-10%",
        "symmetryScore": 96,
        "vTaperScore": 94,
        "muscularity": 94,
        "aestheticsScore": 96,
        "proportionsScore": 95,
        "postureScore": 97,
        "athleticismScore": 93,
        "summary": "Elite-level upper body aesthetics. Exceptional V-taper, sharp muscle separation, and near-perfect postural alignment. Visible six-pack, full delt roundness, and balanced proportions place this physique in the top percentile.",
        "glowUpPrediction": "Already near genetic ceiling for visible upper-body metrics. Focus on maintaining composition and refining weak points like rear delts and forearm density.",
        "predictedPotentialScore": 98,
        "priorityAreas": ["forearms", "traps"],
        "muscleGroups": {
          "shoulders": {"visible": true, "score": 97, "strengths": ["Elite 3D delt development", "Exceptional V-taper frame"], "weaknesses": [], "recommendations": ["Maintain volume", "Rear delt maintenance work"]},
          "chest": {"visible": true, "score": 94, "strengths": ["Full chest thickness", "Sharp upper/lower separation"], "weaknesses": [], "recommendations": ["Maintain incline press"]},
          "biceps": {"visible": true, "score": 93, "strengths": ["Peak visible", "Full arm thickness"], "weaknesses": [], "recommendations": ["Maintenance curls"]},
          "triceps": {"visible": true, "score": 92, "strengths": ["Horseshoe visible", "Full arm sweep"], "weaknesses": [], "recommendations": ["Rope pushdowns maintenance"]},
          "back": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "traps": {"visible": true, "score": 90, "strengths": ["Full trap development"], "weaknesses": ["Mid traps could add 1–2 points"], "recommendations": ["Face pulls", "Y-raises"]},
          "abs": {"visible": true, "score": 96, "strengths": ["Full six-pack visible", "Deep oblique cuts"], "weaknesses": [], "recommendations": ["Maintain current BF", "Vacuum holds"]},
          "forearms": {"visible": true, "score": 88, "strengths": ["Good vascularity", "Solid proportion"], "weaknesses": ["Slight lag vs upper arm"], "recommendations": ["Reverse curls", "Farmer carries"]},
          "quads": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "calves": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []},
          "glutes": {"visible": false, "score": 0, "strengths": [], "weaknesses": [], "recommendations": []}
        },
        "issuesDetected": [],
        "improvementPlan": [
          {"priority": 1, "area": "Maintenance", "action": "Maintain current training and nutrition", "timeframe": "Ongoing", "expectedResult": "Sustain elite composition"}
        ],
        "dietaryRecommendations": [
          {"category": "Protein", "recommendation": "190–210g protein daily", "rationale": "Maintain muscle mass at low body fat."},
          {"category": "Recovery", "recommendation": "Prioritise sleep and hydration", "rationale": "Critical at sub-10% body fat for hormone balance."}
        ],
        "createdAt": "2026-06-07T10:00:00.000Z"
      }'::jsonb,
      now()
    );

  -- Sync profile stats with latest scan
  alter table public.profiles disable trigger protect_profile_columns;

  update public.profiles
  set
    full_name            = coalesce(full_name, 'Demo User'),
    xp                   = 5200,
    streak               = 12,
    last_scan_date       = now(),
    scans_today          = 0,
    last_scan_reset_date = current_date
  where id = v_user_id;

  alter table public.profiles enable trigger protect_profile_columns;

  raise notice 'Demo seed OK for % (%): 5 scans inserted (scores 27 → 46 → 66 → 82 → 95)', v_email, v_user_id;
end $$;

-- Verify
select
  u.email,
  sc.analysis->>'id' as scan_id,
  (sc.analysis->>'overallScore')::int as overall_score,
  sc.analysis->>'bodyFatRange' as body_fat,
  sc.created_at
from auth.users u
join public.scans sc on sc.user_id = u.id
where lower(u.email) = lower('demo@aesthetix.online')
  and sc.analysis->>'id' like 'demo_scan_%'
order by sc.created_at;
