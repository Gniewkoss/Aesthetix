import React from 'react';
import { View, StyleSheet } from 'react-native';
import Body, { Slug } from 'react-native-body-highlighter';
import { RADIUS } from '../../theme';

// ─── Exercise type ─────────────────────────────────────────────────────────────

export type ExerciseType =
  | 'press'
  | 'pull'
  | 'squat'
  | 'curl'
  | 'core'
  | 'calf_raise'
  | 'shrug'
  | 'hinge'
  | 'default';

// ─── Muscle area → exercise type mapping ──────────────────────────────────────
// Handles both direct muscle keys AND the compound area names from improvementPlan.

export function getMuscleExerciseType(areaKey: string): ExerciseType {
  const key = areaKey.toLowerCase();

  const exact: Record<string, ExerciseType> = {
    chest: 'press',
    shoulders: 'press',
    shoulder: 'press',
    triceps: 'press',
    back: 'pull',
    biceps: 'curl',
    forearms: 'curl',
    forearm: 'curl',
    abs: 'core',
    core: 'core',
    quads: 'squat',
    quad: 'squat',
    quadriceps: 'squat',
    glutes: 'hinge',
    glute: 'hinge',
    gluteal: 'hinge',
    calves: 'calf_raise',
    calf: 'calf_raise',
    traps: 'shrug',
    trapezius: 'shrug',
    // compound plan area names
    'body composition': 'core',
    'core development': 'core',
    'upper body': 'press',
    'lower body': 'squat',
  };

  if (exact[key]) return exact[key];

  // Partial keyword scan
  if (key.includes('chest') || key.includes('pec')) return 'press';
  if (key.includes('shoulder') || key.includes('delt')) return 'press';
  if (key.includes('tricep')) return 'press';
  if (key.includes('back') || key.includes('lat') || key.includes('row')) return 'pull';
  if (key.includes('bicep')) return 'curl';
  if (key.includes('forearm') || key.includes('grip')) return 'curl';
  if (key.includes('abs') || key.includes('core') || key.includes('oblique')) return 'core';
  if (key.includes('composition') || key.includes('fat') || key.includes('cut')) return 'core';
  if (key.includes('quad') || key.includes('squat') || key.includes('leg')) return 'squat';
  if (key.includes('glute') || key.includes('hip') || key.includes('deadlift')) return 'hinge';
  if (key.includes('calf') || key.includes('calve')) return 'calf_raise';
  if (key.includes('trap') || key.includes('shrug')) return 'shrug';

  return 'default';
}

// ─── Per-exercise config ───────────────────────────────────────────────────────
// slugs: which muscles to highlight
// side: front or back view
// offsetY: px to crop from the TOP of the rendered body (at the thumbnail scale)
//          body renders at (size × size*2) px — offsetY shows the relevant region

interface ExerciseConfig {
  slugs: Slug[];
  side: 'front' | 'back';
  offsetY: number; // pixels to shift body upward (shows lower region)
}

const EXERCISE_CONFIG: Record<ExerciseType, ExerciseConfig> = {
  press:      { slugs: ['chest', 'deltoids', 'triceps'],        side: 'front', offsetY: 6 },
  pull:       { slugs: ['upper-back', 'lower-back', 'biceps'],  side: 'back',  offsetY: 6 },
  squat:      { slugs: ['quadriceps', 'gluteal'],               side: 'front', offsetY: 58 },
  curl:       { slugs: ['biceps', 'forearm'],                   side: 'front', offsetY: 14 },
  core:       { slugs: ['abs', 'obliques'],                     side: 'front', offsetY: 32 },
  calf_raise: { slugs: ['calves'],                              side: 'back',  offsetY: 72 },
  shrug:      { slugs: ['trapezius', 'deltoids'],               side: 'back',  offsetY: 0 },
  hinge:      { slugs: ['gluteal', 'hamstring', 'lower-back'],  side: 'back',  offsetY: 46 },
  default:    { slugs: ['chest'],                               side: 'front', offsetY: 4 },
};

// ─── Component ─────────────────────────────────────────────────────────────────

interface ExerciseIllustrationProps {
  type: ExerciseType;
  color: string;
  size?: number;
}

export function ExerciseIllustration({ type, color, size = 68 }: ExerciseIllustrationProps) {
  const cfg = EXERCISE_CONFIG[type] ?? EXERCISE_CONFIG.default;

  // Body renders at width=size, height=size*2 at this scale
  const scale = size / 200;

  // Colors: [low intensity, high intensity]
  const highlightColor = color;
  const dimColor = color + '60';

  const data = cfg.slugs.map((slug, i) => ({
    slug,
    color: i === 0 ? highlightColor : dimColor,
    intensity: 2 as const,
  }));

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View style={{ marginTop: -cfg.offsetY }}>
        <Body
          data={data}
          scale={scale}
          side={cfg.side}
          colors={[dimColor, highlightColor]}
          defaultFill="rgba(255,255,255,0.07)"
          defaultStroke="rgba(255,255,255,0.10)"
          defaultStrokeWidth={0.8}
          border="transparent"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    alignItems: 'center',
  },
});
