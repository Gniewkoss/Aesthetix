import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { MuscleGroups, MuscleGroupKey } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

// Front-only and back-only indicator keys (bilateral keys like shoulders/calves appear in both)
const FRONT_INDICATOR_KEYS: MuscleGroupKey[] = ['chest', 'biceps', 'abs', 'quads'];
const BACK_INDICATOR_KEYS: MuscleGroupKey[] = ['back', 'glutes'];

function detectViews(muscleGroups: MuscleGroups): { hasFront: boolean; hasBack: boolean } {
  const hasFront = FRONT_INDICATOR_KEYS.some((k) => muscleGroups[k]?.visible);
  const hasBack  = BACK_INDICATOR_KEYS.some((k) => muscleGroups[k]?.visible);
  return { hasFront, hasBack };
}

// ─── Score → heatmap color ─────────────────────────────────────────────────────
export function getMuscleHeatColor(score: number, visible: boolean): string {
  if (!visible) return 'rgba(255,255,255,0.25)';
  if (score >= 80) return '#22C55E';
  if (score >= 65) return '#84CC16';
  if (score >= 50) return '#EAB308';
  if (score >= 35) return '#F97316';
  return '#EF4444';
}

// ─── Muscle key → library slugs mapping ───────────────────────────────────────
const KEY_TO_SLUGS: Record<MuscleGroupKey, Slug[]> = {
  shoulders: ['deltoids'],
  chest:     ['chest'],
  biceps:    ['biceps'],
  triceps:   ['triceps'],
  back:      ['upper-back', 'lower-back'],
  traps:     ['trapezius'],
  abs:       ['abs', 'obliques'],
  forearms:  ['forearm'],
  quads:     ['quadriceps'],
  calves:    ['calves'],
  glutes:    ['gluteal'],
};

// ─── Library slug → muscle key mapping ────────────────────────────────────────
const SLUG_TO_KEY: Partial<Record<Slug, MuscleGroupKey>> = {
  deltoids:     'shoulders',
  chest:        'chest',
  biceps:       'biceps',
  triceps:      'triceps',
  'upper-back': 'back',
  'lower-back': 'back',
  trapezius:    'traps',
  abs:          'abs',
  obliques:     'abs',
  forearm:      'forearms',
  quadriceps:   'quads',
  calves:       'calves',
  gluteal:      'glutes',
  hamstring:    'quads',
  adductors:    'quads',
};

interface MuscleBodyMapProps {
  muscleGroups: MuscleGroups;
  onMusclePress?: (key: MuscleGroupKey) => void;
  selectedMuscle?: MuscleGroupKey | null;
}

export function MuscleBodyMap({ muscleGroups, onMusclePress, selectedMuscle }: MuscleBodyMapProps) {
  const { hasFront, hasBack } = useMemo(() => detectViews(muscleGroups), [muscleGroups]);

  // Initial view: back only if no front-indicator muscles are visible
  const [view, setView] = useState<'front' | 'back'>(() => {
    const { hasFront: f, hasBack: b } = detectViews(muscleGroups);
    return !f && b ? 'back' : 'front';
  });

  // Keep view in sync if muscleGroups ever change (e.g. navigation)
  useEffect(() => {
    if (!hasFront && hasBack) setView('back');
    else if (hasFront)        setView('front');
  }, [hasFront, hasBack]);

  const showToggle = hasFront && hasBack;

  const bodyData = useMemo<ExtendedBodyPart[]>(() => {
    const items: ExtendedBodyPart[] = [];

    (Object.entries(muscleGroups) as [MuscleGroupKey, MuscleGroups[MuscleGroupKey]][]).forEach(
      ([key, group]) => {
        if (!group.visible) return;

        const color = getMuscleHeatColor(group.score, group.visible);
        const isSelected = selectedMuscle === key;
        const slugs = KEY_TO_SLUGS[key] ?? [];

        slugs.forEach((slug) => {
          items.push({
            slug,
            color: isSelected ? '#FFFFFF' : color,
            styles: isSelected
              ? { stroke: '#FFFFFF', strokeWidth: 1.5 }
              : { stroke: color + '88', strokeWidth: 0.8 },
          });
        });
      }
    );

    return items;
  }, [muscleGroups, selectedMuscle]);

  function handlePress(bodyPart: ExtendedBodyPart, _side?: 'left' | 'right') {
    if (!bodyPart.slug) return;
    const key = SLUG_TO_KEY[bodyPart.slug as Slug];
    if (key) onMusclePress?.(key);
  }

  return (
    <View style={styles.root}>
      {/* View toggle — only shown when both front and back muscles were analyzed */}
      {showToggle && (
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'front' && styles.toggleBtnActive]}
            onPress={() => setView('front')}
            activeOpacity={0.75}
          >
            <Text style={[styles.toggleTxt, view === 'front' && styles.toggleTxtActive]}>FRONT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'back' && styles.toggleBtnActive]}
            onPress={() => setView('back')}
            activeOpacity={0.75}
          >
            <Text style={[styles.toggleTxt, view === 'back' && styles.toggleTxtActive]}>BACK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Anatomical body */}
      <View style={styles.bodyWrap}>
        <Body
          data={bodyData}
          side={view}
          gender="male"
          scale={1.0}
          defaultFill="#1E1E22"
          defaultStroke="rgba(255,255,255,0.18)"
          defaultStrokeWidth={0.6}
          border="rgba(255,255,255,0.22)"
          onBodyPartPress={handlePress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    padding: 3,
    marginBottom: SPACING.md,
  },
  toggleBtn: {
    paddingHorizontal: SPACING.base,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.accent,
  },
  toggleTxt: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: 1.2,
  },
  toggleTxtActive: {
    color: '#FFFFFF',
  },
  // scale=1.0 → 200×400
  bodyWrap: {
    width: 200,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
