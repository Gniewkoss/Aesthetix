// ─── Visual Measurements ───────────────────────────────────────────────────────
// Extracted by GPT-4o Vision from physique images.
// These are OBSERVATIONS only — no scores, no evaluations.
// The scoring engine converts these measurements into deterministic scores.

export interface VisualMeasurements {
  poseType: 'front' | 'back' | 'side' | 'mixed' | 'unknown';
  visibleRegions: string[];
  notVisibleRegions: string[];

  // Estimated width ratios (null if either reference point is not visible)
  shoulderToWaistRatio: number | null;
  shoulderToHipRatio: number | null;
  waistToHipRatio: number | null;

  // Muscle development levels — 0-5 ordinal scale:
  // 0 = none/flat, 1 = minimal, 2 = moderate, 3 = good, 4 = excellent, 5 = world-class elite
  chestDevelopment: number;
  shoulderRoundness: number;
  shoulderWidth: number;
  armThickness: number;        // overall upper arm visual mass
  forearmDevelopment: number;
  trapDevelopment: number;
  backWidth: number | null;    // null if back pose not visible
  absDefinition: number;       // visibility and sharpness of abdominal muscles
  obliqueDevelopment: number;
  quadDevelopment: number | null;
  calfDevelopment: number | null;
  gluteDevelopment: number | null;

  // Body composition indicators — 0-5 ordinal
  muscularSeparation: number;  // visibility of inter-muscle separation and striations
  vascularity: number;         // visible veins
  // 0 = very lean/hard waist, 5 = very soft/high body fat
  waistSoftness: number;

  // Posture — 0-5 ordinal (5 = perfect)
  shoulderAlignment: number;   // horizontal levelness of shoulders
  headPosition: number;        // neutrality of head position vs. forward head
  spinalCurvature: number;     // naturalness of spinal curvature

  // Aesthetics — 0-5 ordinal
  leftRightSymmetry: number;   // bilateral muscle symmetry
  vTaperVisibility: number;    // silhouette taper from shoulders to waist
  latFlare: number | null;     // lat spread width (back pose only)
}

// ─── Raw API Response ──────────────────────────────────────────────────────────
// snake_case response from the measurement extraction GPT call.
// Mapped to VisualMeasurements by the parser.

export interface RawMeasurementResponse {
  pose_type: string;
  visible_regions: string[];
  not_visible_regions: string[];
  shoulder_to_waist_ratio: number | null;
  shoulder_to_hip_ratio: number | null;
  waist_to_hip_ratio: number | null;
  chest_development: number;
  shoulder_roundness: number;
  shoulder_width: number;
  arm_thickness: number;
  forearm_development: number;
  trap_development: number;
  back_width: number | null;
  abs_definition: number;
  oblique_development: number;
  quad_development: number | null;
  calf_development: number | null;
  glute_development: number | null;
  muscular_separation: number;
  vascularity: number;
  waist_softness: number;
  posture_shoulder_alignment: number;
  posture_head_position: number;
  spinal_curvature: number;
  left_right_symmetry: number;
  v_taper_visibility: number;
  lat_flare: number | null;
}
