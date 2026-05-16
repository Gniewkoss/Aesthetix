import { MuscleGroups, MuscleGroupKey, IssueDetected, ImprovementPlanItem } from '../types';
import { CategoryScores } from '../scoring/engine';
import { VisualMeasurements } from '../vision/types';
import { EXERCISE_DATABASE, MUSCLE_TO_DB_KEYS } from './database';

const WEAK_THRESHOLD     = 52;  // score < 52 → high priority
const MODERATE_THRESHOLD = 66;  // score < 66 → medium priority

// ─── Exercise Recommendations ──────────────────────────────────────────────────
// Derives exercises from weak muscle scores using the structured database.
// GPT never selects exercises — it only explains why these specific exercises help.

export function buildImprovementPlan(
  muscleGroups: MuscleGroups,
  categoryScores: CategoryScores,
  measurements: VisualMeasurements,
): ImprovementPlanItem[] {
  const prioritized: Array<{ area: string; exercises: string[]; timeframe: string; priority: number }> = [];

  // Muscle-based entries
  for (const [key, dbKeys] of Object.entries(MUSCLE_TO_DB_KEYS)) {
    const group = muscleGroups[key as MuscleGroupKey];
    if (!group.visible || group.score === 0) continue;

    if (group.score < WEAK_THRESHOLD || group.score < MODERATE_THRESHOLD) {
      const allExercises = dbKeys.flatMap((k) => EXERCISE_DATABASE[k]?.primary ?? []);
      const unique = [...new Set(allExercises)].slice(0, 3);
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      prioritized.push({
        area: label,
        exercises: unique,
        timeframe: group.score < WEAK_THRESHOLD ? '4–8 weeks' : '8–12 weeks',
        priority: group.score,
      });
    }
  }

  // Posture-based entries
  if (measurements.headPosition < 3) {
    prioritized.push({
      area: 'Posture – Forward Head',
      exercises: EXERCISE_DATABASE.posture_forward_head.primary,
      timeframe: '4–6 weeks',
      priority: measurements.headPosition * 10,
    });
  }
  if (measurements.shoulderAlignment < 3) {
    prioritized.push({
      area: 'Posture – Shoulder Alignment',
      exercises: EXERCISE_DATABASE.posture_rounded_shoulders.primary,
      timeframe: '4–6 weeks',
      priority: measurements.shoulderAlignment * 10,
    });
  }

  // Sort ascending by priority (lower score = higher priority)
  prioritized.sort((a, b) => a.priority - b.priority);

  return prioritized.slice(0, 4).map((item, i) => ({
    priority: i + 1,
    area: item.area,
    action: item.exercises.join(', '),
    timeframe: item.timeframe,
    expectedResult: `Improved ${item.area.toLowerCase()} development and visual impact`,
  }));
}

// ─── Issue Detection ───────────────────────────────────────────────────────────
// Rule-based: each issue has a deterministic condition and fixed category/severity.
// The coaching LLM adds narrative explanation — it does not create the issues.

export function detectIssues(
  muscleGroups: MuscleGroups,
  categoryScores: CategoryScores,
  measurements: VisualMeasurements,
): IssueDetected[] {
  const issues: IssueDetected[] = [];
  const ts = Date.now();

  // Symmetry
  if (measurements.leftRightSymmetry < 3) {
    issues.push({
      id: `issue_sym_${ts}`,
      title: 'Left-Right Muscular Imbalance',
      description:
        'Visible asymmetry between left and right sides. May indicate dominant-side overuse or neglect of the weaker side during training.',
      severity: measurements.leftRightSymmetry < 2 ? 'high' : 'medium',
      category: 'symmetry',
    });
  }

  // Body composition
  if (measurements.waistSoftness >= 3) {
    issues.push({
      id: `issue_bf_${ts}`,
      title: 'Body Fat Above Aesthetic Threshold',
      description:
        'Current body fat is limiting muscle definition visibility. Reducing body fat would significantly improve muscularity score and overall aesthetics.',
      severity: measurements.waistSoftness >= 4 ? 'high' : 'medium',
      category: 'composition',
    });
  }

  // Posture: forward head
  if (measurements.headPosition < 3) {
    issues.push({
      id: `issue_fhp_${ts}`,
      title: 'Forward Head Posture',
      description:
        'Head is positioned anterior to optimal spinal alignment. Common cause: tight chest and anterior neck muscles, weak deep cervical flexors.',
      severity: measurements.headPosition < 2 ? 'high' : 'low',
      category: 'posture',
    });
  }

  // Posture: shoulder alignment
  if (measurements.shoulderAlignment < 3) {
    issues.push({
      id: `issue_shal_${ts}`,
      title: 'Shoulder Level Asymmetry',
      description:
        'Shoulders are not at equal height. May indicate a muscle imbalance between left and right sides, or a lateral spinal deviation.',
      severity: 'medium',
      category: 'posture',
    });
  }

  // V-taper proportion
  if (categoryScores.vTaper < 45 && muscleGroups.shoulders.visible) {
    issues.push({
      id: `issue_vtaper_${ts}`,
      title: 'Underdeveloped V-Taper',
      description:
        'Shoulder-to-waist ratio is below aesthetic standards. Building shoulder width and reducing waist circumference are both required to improve this.',
      severity: 'medium',
      category: 'proportion',
    });
  }

  // Push muscle balance
  if (muscleGroups.shoulders.visible && muscleGroups.chest.visible) {
    const diff = Math.abs(muscleGroups.shoulders.score - muscleGroups.chest.score);
    if (diff > 22) {
      const stronger = muscleGroups.shoulders.score > muscleGroups.chest.score ? 'shoulders' : 'chest';
      issues.push({
        id: `issue_push_${ts}`,
        title: 'Push Muscle Imbalance',
        description: `${stronger.charAt(0).toUpperCase() + stronger.slice(1)} significantly outpaces the opposite push muscle group. Balanced pressing program recommended.`,
        severity: 'low',
        category: 'balance',
      });
    }
  }

  return issues;
}

// ─── Priority Areas ────────────────────────────────────────────────────────────
// Returns the top 3 visible muscle keys sorted by score ascending (weakest first).

export function computePriorityAreas(muscleGroups: MuscleGroups): string[] {
  return (Object.entries(muscleGroups) as [MuscleGroupKey, typeof muscleGroups[MuscleGroupKey]][])
    .filter(([, g]) => g.visible && g.score > 0)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([key]) => key);
}
