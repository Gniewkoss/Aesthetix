import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { G, Circle, Ellipse, Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MuscleGroups, MuscleGroupKey } from '../../types';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

// ─── Score → Color ─────────────────────────────────────────────────────────────
export function getMuscleHeatColor(score: number, visible: boolean): string {
  if (!visible) return 'rgba(255,255,255,0.07)';
  if (score >= 80) return '#22C55E';
  if (score >= 65) return '#84CC16';
  if (score >= 50) return '#EAB308';
  if (score >= 35) return '#F97316';
  return '#EF4444';
}

function getMuscleStroke(score: number, visible: boolean): string {
  if (!visible) return 'rgba(255,255,255,0.12)';
  const c = getMuscleHeatColor(score, visible);
  return c + 'AA';
}

// ─── Body silhouette base color ────────────────────────────────────────────────
const SILHOUETTE = 'rgba(255,255,255,0.07)';
const SILHOUETTE_STROKE = 'rgba(255,255,255,0.15)';
const SW = 1; // stroke width for silhouette
const MSW = 1.5; // stroke width for muscle overlays

interface MuscleRegion {
  key: MuscleGroupKey;
  label: string;
}

interface MuscleBodyMapProps {
  muscleGroups: MuscleGroups;
  onMusclePress?: (key: MuscleGroupKey) => void;
  selectedMuscle?: MuscleGroupKey | null;
}

// ─── FRONT VIEW ───────────────────────────────────────────────────────────────
function FrontBody({ muscleGroups, onMusclePress, selectedMuscle }: MuscleBodyMapProps) {
  const mg = muscleGroups;

  function overlay(key: MuscleGroupKey) {
    const g = mg[key];
    const fill = getMuscleHeatColor(g.score, g.visible);
    const stroke = getMuscleStroke(g.score, g.visible);
    const opacity = g.visible ? 0.78 : 0.35;
    const selected = selectedMuscle === key;
    return {
      fill,
      stroke: selected ? '#FFFFFF' : stroke,
      strokeWidth: selected ? 2 : MSW,
      fillOpacity: selected ? 0.95 : opacity,
    };
  }

  return (
    <Svg viewBox="0 0 160 390" width="100%" height="100%">
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(255,255,255,0.05)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0.02)" />
        </LinearGradient>
      </Defs>

      {/* ── Silhouette background ── */}

      {/* Head */}
      <Circle cx={80} cy={26} r={21} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />

      {/* Neck */}
      <Rect x={73} y={45} width={14} height={15} rx={5} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />

      {/* Torso + shoulder block */}
      <Path
        d="M 70 59 C 54 59 18 66 12 82 C 6 96 10 106 20 112 C 28 116 36 106 38 102 L 36 188 C 34 202 34 212 38 224 L 60 230 L 80 234 L 100 230 L 122 224 C 126 212 126 202 124 188 L 122 102 C 124 106 132 116 140 112 C 150 106 154 96 148 82 C 142 66 106 59 90 59 Z"
        fill={SILHOUETTE}
        stroke={SILHOUETTE_STROKE}
        strokeWidth={SW}
      />

      {/* Left upper arm */}
      <Ellipse cx={20} cy={116} rx={13} ry={36} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      {/* Right upper arm */}
      <Ellipse cx={140} cy={116} rx={13} ry={36} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />

      {/* Left forearm */}
      <Ellipse cx={14} cy={178} rx={10} ry={26} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      {/* Right forearm */}
      <Ellipse cx={146} cy={178} rx={10} ry={26} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />

      {/* Left thigh */}
      <Ellipse cx={63} cy={268} rx={22} ry={48} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      {/* Right thigh */}
      <Ellipse cx={97} cy={268} rx={22} ry={48} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />

      {/* Left shin */}
      <Ellipse cx={60} cy={350} rx={15} ry={28} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      {/* Right shin */}
      <Ellipse cx={100} cy={350} rx={15} ry={28} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />

      {/* ── Muscle overlays (front) ── */}

      {/* SHOULDERS */}
      <G onPress={() => onMusclePress?.('shoulders')}>
        <Ellipse cx={30} cy={82} rx={17} ry={13} {...overlay('shoulders')} />
        <Ellipse cx={130} cy={82} rx={17} ry={13} {...overlay('shoulders')} />
      </G>

      {/* TRAPS (visible from front — top of shoulder/neck junction) */}
      <G onPress={() => onMusclePress?.('traps')}>
        <Path d="M 70 59 L 48 74 L 62 82 L 74 68 Z" {...overlay('traps')} />
        <Path d="M 90 59 L 112 74 L 98 82 L 86 68 Z" {...overlay('traps')} />
      </G>

      {/* CHEST */}
      <G onPress={() => onMusclePress?.('chest')}>
        <Ellipse cx={67} cy={100} rx={20} ry={18} {...overlay('chest')} />
        <Ellipse cx={93} cy={100} rx={20} ry={18} {...overlay('chest')} />
      </G>

      {/* BICEPS */}
      <G onPress={() => onMusclePress?.('biceps')}>
        <Ellipse cx={20} cy={112} rx={10} ry={27} {...overlay('biceps')} />
        <Ellipse cx={140} cy={112} rx={10} ry={27} {...overlay('biceps')} />
      </G>

      {/* FOREARMS */}
      <G onPress={() => onMusclePress?.('forearms')}>
        <Ellipse cx={14} cy={176} rx={8} ry={22} {...overlay('forearms')} />
        <Ellipse cx={146} cy={176} rx={8} ry={22} {...overlay('forearms')} />
      </G>

      {/* ABS — 3×2 grid */}
      <G onPress={() => onMusclePress?.('abs')}>
        {/* row 1 */}
        <Rect x={68} y={122} width={11} height={11} rx={3} {...overlay('abs')} />
        <Rect x={81} y={122} width={11} height={11} rx={3} {...overlay('abs')} />
        {/* row 2 */}
        <Rect x={68} y={137} width={11} height={11} rx={3} {...overlay('abs')} />
        <Rect x={81} y={137} width={11} height={11} rx={3} {...overlay('abs')} />
        {/* row 3 */}
        <Rect x={68} y={152} width={11} height={11} rx={3} {...overlay('abs')} />
        <Rect x={81} y={152} width={11} height={11} rx={3} {...overlay('abs')} />
        {/* obliques */}
        <Rect x={55} y={126} width={9} height={38} rx={4} {...overlay('abs')} fillOpacity={(overlay('abs').fillOpacity as number) * 0.6} />
        <Rect x={96} y={126} width={9} height={38} rx={4} {...overlay('abs')} fillOpacity={(overlay('abs').fillOpacity as number) * 0.6} />
      </G>

      {/* QUADS */}
      <G onPress={() => onMusclePress?.('quads')}>
        <Ellipse cx={63} cy={264} rx={19} ry={42} {...overlay('quads')} />
        <Ellipse cx={97} cy={264} rx={19} ry={42} {...overlay('quads')} />
      </G>

      {/* CALVES (front visible) */}
      <G onPress={() => onMusclePress?.('calves')}>
        <Ellipse cx={59} cy={347} rx={13} ry={24} {...overlay('calves')} />
        <Ellipse cx={101} cy={347} rx={13} ry={24} {...overlay('calves')} />
      </G>
    </Svg>
  );
}

// ─── BACK VIEW ─────────────────────────────────────────────────────────────────
function BackBody({ muscleGroups, onMusclePress, selectedMuscle }: MuscleBodyMapProps) {
  const mg = muscleGroups;

  function overlay(key: MuscleGroupKey) {
    const g = mg[key];
    const fill = getMuscleHeatColor(g.score, g.visible);
    const stroke = getMuscleStroke(g.score, g.visible);
    const opacity = g.visible ? 0.78 : 0.35;
    const selected = selectedMuscle === key;
    return {
      fill,
      stroke: selected ? '#FFFFFF' : stroke,
      strokeWidth: selected ? 2 : MSW,
      fillOpacity: selected ? 0.95 : opacity,
    };
  }

  return (
    <Svg viewBox="0 0 160 390" width="100%" height="100%">
      {/* ── Silhouette ── */}
      <Circle cx={80} cy={26} r={21} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Rect x={73} y={45} width={14} height={15} rx={5} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Path
        d="M 70 59 C 54 59 18 66 12 82 C 6 96 10 106 20 112 C 28 116 36 106 38 102 L 36 188 C 34 202 34 212 38 224 L 60 230 L 80 234 L 100 230 L 122 224 C 126 212 126 202 124 188 L 122 102 C 124 106 132 116 140 112 C 150 106 154 96 148 82 C 142 66 106 59 90 59 Z"
        fill={SILHOUETTE}
        stroke={SILHOUETTE_STROKE}
        strokeWidth={SW}
      />
      <Ellipse cx={20} cy={116} rx={13} ry={36} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Ellipse cx={140} cy={116} rx={13} ry={36} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Ellipse cx={14} cy={178} rx={10} ry={26} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Ellipse cx={146} cy={178} rx={10} ry={26} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Ellipse cx={63} cy={268} rx={22} ry={48} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Ellipse cx={97} cy={268} rx={22} ry={48} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Ellipse cx={60} cy={350} rx={15} ry={28} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />
      <Ellipse cx={100} cy={350} rx={15} ry={28} fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={SW} />

      {/* ── Muscle overlays (back) ── */}

      {/* TRAPS (prominent from back) */}
      <G onPress={() => onMusclePress?.('traps')}>
        <Path d="M 70 59 L 30 80 L 50 88 L 72 70 Z" {...overlay('traps')} />
        <Path d="M 90 59 L 130 80 L 110 88 L 88 70 Z" {...overlay('traps')} />
        {/* Central upper trap */}
        <Path d="M 72 59 L 80 46 L 88 59 L 80 64 Z" {...overlay('traps')} />
      </G>

      {/* SHOULDERS (rear deltoids) */}
      <G onPress={() => onMusclePress?.('shoulders')}>
        <Ellipse cx={30} cy={82} rx={17} ry={13} {...overlay('shoulders')} />
        <Ellipse cx={130} cy={82} rx={17} ry={13} {...overlay('shoulders')} />
      </G>

      {/* BACK / LATS */}
      <G onPress={() => onMusclePress?.('back')}>
        {/* Left lat */}
        <Path d="M 38 102 C 30 118 28 145 36 175 L 50 175 C 50 155 54 130 64 110 Z" {...overlay('back')} />
        {/* Right lat */}
        <Path d="M 122 102 C 130 118 132 145 124 175 L 110 175 C 110 155 106 130 96 110 Z" {...overlay('back')} />
        {/* Mid back */}
        <Rect x={58} y={102} width={44} height={72} rx={8} {...overlay('back')} fillOpacity={(overlay('back').fillOpacity as number) * 0.7} />
      </G>

      {/* TRICEPS */}
      <G onPress={() => onMusclePress?.('triceps')}>
        <Ellipse cx={20} cy={118} rx={10} ry={28} {...overlay('triceps')} />
        <Ellipse cx={140} cy={118} rx={10} ry={28} {...overlay('triceps')} />
      </G>

      {/* FOREARMS (back) */}
      <G onPress={() => onMusclePress?.('forearms')}>
        <Ellipse cx={14} cy={176} rx={8} ry={22} {...overlay('forearms')} />
        <Ellipse cx={146} cy={176} rx={8} ry={22} {...overlay('forearms')} />
      </G>

      {/* GLUTES */}
      <G onPress={() => onMusclePress?.('glutes')}>
        <Ellipse cx={66} cy={222} rx={22} ry={18} {...overlay('glutes')} />
        <Ellipse cx={94} cy={222} rx={22} ry={18} {...overlay('glutes')} />
      </G>

      {/* QUADS (back of legs = hamstrings, but mapped to quads key visually) */}
      <G onPress={() => onMusclePress?.('quads')}>
        <Ellipse cx={63} cy={264} rx={19} ry={42} {...overlay('quads')} />
        <Ellipse cx={97} cy={264} rx={19} ry={42} {...overlay('quads')} />
      </G>

      {/* CALVES (back) */}
      <G onPress={() => onMusclePress?.('calves')}>
        <Ellipse cx={59} cy={347} rx={13} ry={24} {...overlay('calves')} />
        <Ellipse cx={101} cy={347} rx={13} ry={24} {...overlay('calves')} />
      </G>
    </Svg>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function MuscleBodyMap({ muscleGroups, onMusclePress, selectedMuscle }: MuscleBodyMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  return (
    <View style={styles.root}>
      {/* Toggle */}
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

      {/* Body SVG */}
      <View style={styles.svgWrap}>
        {view === 'front'
          ? <FrontBody muscleGroups={muscleGroups} onMusclePress={onMusclePress} selectedMuscle={selectedMuscle} />
          : <BackBody muscleGroups={muscleGroups} onMusclePress={onMusclePress} selectedMuscle={selectedMuscle} />
        }
      </View>

      {/* Tap hint */}
      <Text style={styles.hint}>Tap a muscle group to view details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  svgWrap: {
    width: 180,
    height: 420,
  },
  hint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    marginTop: SPACING.sm,
    letterSpacing: 0.2,
  },
});
