// ─── Exercise Database ─────────────────────────────────────────────────────────
// Structured, curated exercise recommendations.
// Keyed by muscle sub-target so the recommendation engine can pick the right
// cluster based on WHAT is weak (e.g. lat width vs. back thickness).
// GPT's coaching layer then explains WHY these exercises help — it does not
// select or invent exercises from scratch.

export interface ExerciseCluster {
  primary: string[];
  secondary: string[];
}

export const EXERCISE_DATABASE: Record<string, ExerciseCluster> = {
  // ── Shoulders ──────────────────────────────────────────────────────────────
  shoulders_overall: {
    primary:   ['Overhead barbell press', 'Seated dumbbell press', 'Machine shoulder press'],
    secondary: ['Push press', 'Arnold press'],
  },
  shoulders_lateral: {
    primary:   ['Dumbbell lateral raises', 'Cable lateral raises', 'Machine lateral raises'],
    secondary: ['Leaning lateral raises', 'Partial lateral raises with 3-second hold'],
  },
  shoulders_rear: {
    primary:   ['Face pulls', 'Reverse pec deck', 'Rear delt dumbbell rows'],
    secondary: ['Band pull-aparts', 'Cable reverse flyes', 'Prone Y-T-W raises'],
  },

  // ── Chest ──────────────────────────────────────────────────────────────────
  chest_overall: {
    primary:   ['Flat barbell bench press', 'Dumbbell bench press', 'Chest press machine'],
    secondary: ['Weighted push-ups', 'Cable chest press'],
  },
  chest_upper: {
    primary:   ['Incline barbell press', 'Incline dumbbell press', 'High cable crossovers'],
    secondary: ['Incline dumbbell flyes', 'Hammer Strength incline'],
  },
  chest_lower: {
    primary:   ['Decline press', 'Weighted dips', 'Low cable crossovers'],
    secondary: ['Decline dumbbell flyes'],
  },
  chest_inner: {
    primary:   ['Cable crossovers', 'Pec deck machine', 'Dumbbell flyes'],
    secondary: ['Squeeze press', 'Single-arm cable crossover'],
  },

  // ── Biceps ─────────────────────────────────────────────────────────────────
  biceps_overall: {
    primary:   ['Barbell curls', 'Incline dumbbell curls', 'Cable curls'],
    secondary: ['EZ-bar curls', 'Concentration curls'],
  },
  biceps_peak: {
    primary:   ['Incline dumbbell curls', 'Spider curls', 'High cable curls'],
    secondary: ['Preacher curls', 'Concentration curls'],
  },
  biceps_thickness: {
    primary:   ['Hammer curls', 'Cross-body hammer curls', 'Zottman curls'],
    secondary: ['Reverse curls', 'Rope hammer curls'],
  },

  // ── Triceps ────────────────────────────────────────────────────────────────
  triceps_overall: {
    primary:   ['Close-grip bench press', 'Weighted dips', 'Skull crushers'],
    secondary: ['Diamond push-ups'],
  },
  triceps_longhead: {
    primary:   ['Overhead cable tricep extension', 'Overhead dumbbell extension', 'Lying EZ-bar extension'],
    secondary: ['Incline cable overhead extension'],
  },
  triceps_horseshoe: {
    primary:   ['Cable pushdowns (rope attachment)', 'V-bar pushdowns', 'Reverse-grip pushdowns'],
    secondary: ['Dumbbell kickbacks'],
  },

  // ── Back ───────────────────────────────────────────────────────────────────
  back_width: {
    primary:   ['Wide-grip pull-ups', 'Wide-grip lat pulldowns', 'Straight-arm pulldowns'],
    secondary: ['Single-arm pulldown', 'Cable rows to hips'],
  },
  back_thickness: {
    primary:   ['Barbell rows', 'T-bar rows', 'Chest-supported dumbbell rows'],
    secondary: ['Seal rows', 'Pendlay rows'],
  },
  lats_overall: {
    primary:   ['Pull-ups / chin-ups', 'Lat pulldown (various grips)', 'Single-arm pulldown'],
    secondary: ['Straight-arm pulldown', 'Dumbbell pullover'],
  },

  // ── Traps ──────────────────────────────────────────────────────────────────
  traps_upper: {
    primary:   ['Barbell shrugs', 'Dumbbell shrugs', 'Rack pulls'],
    secondary: ['Farmer carries'],
  },
  traps_mid_lower: {
    primary:   ['Face pulls', 'Band pull-aparts', 'Chest-supported rows (wide grip)'],
    secondary: ['Prone Y-raises', 'Cable Y-raises'],
  },

  // ── Abs / Core ─────────────────────────────────────────────────────────────
  abs_overall: {
    primary:   ['Hanging leg raises', 'Ab wheel rollouts', 'Plank variations'],
    secondary: ['Dead bugs', 'Dragon flags'],
  },
  abs_rectus: {
    primary:   ['Weighted cable crunches', 'Decline sit-ups', 'Reverse crunches'],
    secondary: ['Leg raises', 'Machine crunches'],
  },
  abs_obliques: {
    primary:   ['Pallof press', 'Cable woodchops', 'Side plank with reach'],
    secondary: ['Landmine rotations', 'Russian twists (weighted)'],
  },

  // ── Forearms ───────────────────────────────────────────────────────────────
  forearms_overall: {
    primary:   ['Reverse curls', 'Wrist curls', 'Reverse wrist curls'],
    secondary: ['Zottman curls', 'Behind-the-back wrist curls'],
  },
  forearms_grip: {
    primary:   ['Farmer carries', 'Thick-bar deadlifts', 'Plate pinches'],
    secondary: ['Towel pull-ups', 'Grip crushers'],
  },

  // ── Quads ──────────────────────────────────────────────────────────────────
  quads_overall: {
    primary:   ['Barbell squats', 'Leg press', 'Hack squats'],
    secondary: ['Bulgarian split squats', 'Leg extensions'],
  },
  quads_teardrop: {
    primary:   ['Leg extensions', 'Sissy squats', 'Narrow-stance hack squats'],
    secondary: ['Front squats', 'Cyclist squats'],
  },

  // ── Calves ─────────────────────────────────────────────────────────────────
  calves_overall: {
    primary:   ['Standing calf raises', 'Seated calf raises', 'Leg-press calf raises'],
    secondary: ['Donkey calf raises', 'Single-leg calf raises'],
  },

  // ── Glutes ─────────────────────────────────────────────────────────────────
  glutes_overall: {
    primary:   ['Hip thrusts (barbell)', 'Romanian deadlifts', 'Glute bridges'],
    secondary: ['Step-ups', 'Cable kickbacks', 'Sumo squats'],
  },

  // ── Posture Correctives ────────────────────────────────────────────────────
  posture_forward_head: {
    primary:   ['Chin tucks', 'Cervical retraction holds', 'Dead hangs'],
    secondary: ['Wall angels', 'Band pull-aparts'],
  },
  posture_rounded_shoulders: {
    primary:   ['Face pulls', 'Band pull-aparts', 'Wall slides'],
    secondary: ['Prone Y-T-W raises', 'External rotation (cable)'],
  },
  posture_anterior_pelvic_tilt: {
    primary:   ['Hip flexor stretches', 'Glute bridges', 'Dead bugs'],
    secondary: ['McGill Bird Dog', 'Posterior pelvic tilt drill'],
  },
};

// ─── Muscle Key → DB Key Map ───────────────────────────────────────────────────
// Maps analysis muscle keys to exercise clusters in priority order.
export const MUSCLE_TO_DB_KEYS: Record<string, string[]> = {
  shoulders: ['shoulders_overall', 'shoulders_lateral', 'shoulders_rear'],
  chest:     ['chest_overall',     'chest_upper',       'chest_inner'],
  biceps:    ['biceps_overall',    'biceps_peak',       'biceps_thickness'],
  triceps:   ['triceps_overall',   'triceps_longhead',  'triceps_horseshoe'],
  back:      ['back_width',        'lats_overall',      'back_thickness'],
  traps:     ['traps_mid_lower',   'traps_upper'],
  abs:       ['abs_overall',       'abs_rectus',        'abs_obliques'],
  forearms:  ['forearms_overall',  'forearms_grip'],
  quads:     ['quads_overall',     'quads_teardrop'],
  calves:    ['calves_overall'],
  glutes:    ['glutes_overall'],
};
