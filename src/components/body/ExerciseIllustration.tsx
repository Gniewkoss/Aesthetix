import React from 'react';
import Svg, { Circle, Line, Path, Rect, Ellipse, G } from 'react-native-svg';

// ─── Exercise type → illustration mapping ─────────────────────────────────────
export type ExerciseType =
  | 'press'        // chest, shoulders, triceps — push motion
  | 'pull'         // back, biceps — pull/row
  | 'squat'        // quads, glutes — leg press / squat
  | 'curl'         // biceps, forearms — arm curl
  | 'core'         // abs — plank / crunch
  | 'calf_raise'   // calves
  | 'shrug'        // traps — overhead / shrug
  | 'hinge'        // glutes, back — hip hinge / deadlift
  | 'default';

export function getMuscleExerciseType(muscleKey: string): ExerciseType {
  const map: Record<string, ExerciseType> = {
    chest:     'press',
    shoulders: 'press',
    triceps:   'press',
    back:      'pull',
    biceps:    'curl',
    forearms:  'curl',
    abs:       'core',
    quads:     'squat',
    glutes:    'hinge',
    calves:    'calf_raise',
    traps:     'shrug',
  };
  return map[muscleKey] ?? 'default';
}

// ─── Common stroke props for clean, premium look ───────────────────────────────
const LINE_PROPS = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

interface IllustrationProps {
  color: string;
  size?: number;
}

// ── PRESS — push-up / bench press ─────────────────────────────────────────────
function PressIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Head */}
      <Circle cx={20} cy={16} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Body horizontal (plank position) */}
      <Line x1={27} y1={20} x2={60} y2={28} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left arm down to floor */}
      <Line x1={36} y1={22} x2={30} y2={38} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right arm down to floor */}
      <Line x1={50} y1={25} x2={44} y2={41} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Hips */}
      <Line x1={60} y1={28} x2={64} y2={44} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left leg */}
      <Line x1={64} y1={44} x2={58} y2={58} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right leg */}
      <Line x1={64} y1={44} x2={68} y2={60} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Floor line */}
      <Line x1={18} y1={58} x2={68} y2={62} stroke={s} strokeWidth={1.5} strokeOpacity={0.4} {...LINE_PROPS} />
      {/* Muscle highlight — chest area arc */}
      <Path d="M 32 20 Q 36 17 40 22" fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.9} {...LINE_PROPS} />
    </Svg>
  );
}

// ── PULL — lat pulldown / pull-up ─────────────────────────────────────────────
function PullIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Bar at top */}
      <Line x1={14} y1={8} x2={58} y2={8} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left hand grip */}
      <Circle cx={18} cy={8} r={3} fill={s} />
      {/* Right hand grip */}
      <Circle cx={54} cy={8} r={3} fill={s} />
      {/* Head */}
      <Circle cx={36} cy={22} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Left arm up to bar */}
      <Line x1={18} y1={8} x2={30} y2={20} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right arm up to bar */}
      <Line x1={54} y1={8} x2={42} y2={20} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Torso */}
      <Line x1={36} y1={29} x2={36} y2={50} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left thigh */}
      <Line x1={36} y1={50} x2={28} y2={64} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right thigh */}
      <Line x1={36} y1={50} x2={44} y2={64} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Muscle highlight — lat width arc */}
      <Path d="M 29 30 C 22 38 22 46 28 52" fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.9} {...LINE_PROPS} />
      <Path d="M 43 30 C 50 38 50 46 44 52" fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.9} {...LINE_PROPS} />
    </Svg>
  );
}

// ── SQUAT ─────────────────────────────────────────────────────────────────────
function SquatIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Head */}
      <Circle cx={36} cy={12} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Bar on shoulders */}
      <Line x1={14} y1={24} x2={58} y2={24} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Torso angled (squat lean) */}
      <Line x1={36} y1={19} x2={34} y2={38} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left arm to bar */}
      <Line x1={34} y1={28} x2={20} y2={24} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right arm to bar */}
      <Line x1={34} y1={28} x2={50} y2={24} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left thigh (bent, parallel) */}
      <Line x1={34} y1={38} x2={22} y2={54} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right thigh */}
      <Line x1={34} y1={38} x2={48} y2={54} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left shin */}
      <Line x1={22} y1={54} x2={20} y2={66} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right shin */}
      <Line x1={48} y1={54} x2={50} y2={66} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Floor */}
      <Line x1={10} y1={66} x2={62} y2={66} stroke={s} strokeWidth={1.5} strokeOpacity={0.4} {...LINE_PROPS} />
      {/* Muscle highlight — quad area */}
      <Path d="M 22 54 Q 18 48 22 42" fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.9} {...LINE_PROPS} />
      <Path d="M 48 54 Q 52 48 48 42" fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.9} {...LINE_PROPS} />
    </Svg>
  );
}

// ── CURL — dumbbell curl ──────────────────────────────────────────────────────
function CurlIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Head */}
      <Circle cx={36} cy={12} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Torso */}
      <Line x1={36} y1={19} x2={36} y2={44} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left arm — straight down (relaxed) */}
      <Line x1={36} y1={26} x2={22} y2={42} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={22} y1={42} x2={20} y2={56} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Dumbbell left */}
      <Line x1={16} y1={56} x2={24} y2={56} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      {/* Right arm — curled up (active) */}
      <Line x1={36} y1={26} x2={50} y2={36} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={50} y1={36} x2={56} y2={24} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Dumbbell right */}
      <Line x1={52} y1={20} x2={60} y2={20} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      {/* Legs */}
      <Line x1={36} y1={44} x2={28} y2={62} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={36} y1={44} x2={44} y2={62} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Muscle highlight — bicep arc on right arm */}
      <Path d="M 50 36 Q 56 30 56 24" fill="none" stroke={color} strokeWidth={3.5} strokeOpacity={0.9} {...LINE_PROPS} />
    </Svg>
  );
}

// ── CORE — plank / crunch ─────────────────────────────────────────────────────
function CoreIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Head */}
      <Circle cx={16} cy={30} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Body — straight plank */}
      <Line x1={23} y1={34} x2={60} y2={42} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left arm (elbow on floor) */}
      <Line x1={30} y1={36} x2={26} y2={50} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Elbow to floor */}
      <Line x1={20} y1={50} x2={32} y2={50} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      {/* Right arm (elbow on floor) */}
      <Line x1={44} y1={39} x2={40} y2={54} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={34} y1={54} x2={46} y2={54} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      {/* Hips */}
      <Line x1={60} y1={42} x2={64} y2={55} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left leg straight */}
      <Line x1={64} y1={55} x2={58} y2={66} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right leg straight */}
      <Line x1={64} y1={55} x2={68} y2={66} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Floor */}
      <Line x1={14} y1={66} x2={70} y2={66} stroke={s} strokeWidth={1.5} strokeOpacity={0.4} {...LINE_PROPS} />
      {/* Muscle highlight — core area glow dots */}
      <Circle cx={40} cy={39} r={3} fill={color} fillOpacity={0.6} />
      <Circle cx={48} cy={41} r={2.5} fill={color} fillOpacity={0.45} />
      <Circle cx={34} cy={37} r={2.5} fill={color} fillOpacity={0.45} />
    </Svg>
  );
}

// ── CALF RAISE ────────────────────────────────────────────────────────────────
function CalfRaiseIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Head */}
      <Circle cx={36} cy={10} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Torso */}
      <Line x1={36} y1={17} x2={36} y2={38} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left arm */}
      <Line x1={36} y1={24} x2={22} y2={34} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right arm (holds bar / wall) */}
      <Line x1={36} y1={24} x2={50} y2={34} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Wall/bar */}
      <Line x1={56} y1={28} x2={56} y2={66} stroke={s} strokeWidth={1.5} strokeOpacity={0.35} {...LINE_PROPS} />
      {/* Left thigh */}
      <Line x1={36} y1={38} x2={30} y2={54} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right thigh */}
      <Line x1={36} y1={38} x2={42} y2={54} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left shin angled (on toes) */}
      <Line x1={30} y1={54} x2={28} y2={62} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right shin */}
      <Line x1={42} y1={54} x2={44} y2={62} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Toes up (raised heel) */}
      <Line x1={26} y1={62} x2={30} y2={64} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      <Line x1={42} y1={64} x2={46} y2={62} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      {/* Floor */}
      <Line x1={16} y1={64} x2={56} y2={64} stroke={s} strokeWidth={1.5} strokeOpacity={0.4} {...LINE_PROPS} />
      {/* Muscle highlight — calf arc */}
      <Path d="M 28 62 Q 24 56 26 50" fill="none" stroke={color} strokeWidth={3.5} strokeOpacity={0.9} {...LINE_PROPS} />
      <Path d="M 44 62 Q 48 56 46 50" fill="none" stroke={color} strokeWidth={3.5} strokeOpacity={0.9} {...LINE_PROPS} />
    </Svg>
  );
}

// ── SHRUG — trap shrug / overhead press ───────────────────────────────────────
function ShrugIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Head — elevated (shoulders raised) */}
      <Circle cx={36} cy={10} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Torso */}
      <Line x1={36} y1={17} x2={36} y2={42} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Raised shoulders — high position */}
      <Line x1={36} y1={22} x2={18} y2={20} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={36} y1={22} x2={54} y2={20} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left arm down with dumbbell */}
      <Line x1={18} y1={20} x2={16} y2={46} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={12} y1={46} x2={20} y2={46} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      {/* Right arm down */}
      <Line x1={54} y1={20} x2={56} y2={46} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={52} y1={46} x2={60} y2={46} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      {/* Legs */}
      <Line x1={36} y1={42} x2={28} y2={60} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={36} y1={42} x2={44} y2={60} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Floor */}
      <Line x1={14} y1={64} x2={58} y2={64} stroke={s} strokeWidth={1.5} strokeOpacity={0.4} {...LINE_PROPS} />
      {/* Muscle highlight — trap area */}
      <Path d="M 24 22 Q 36 14 48 22" fill="none" stroke={color} strokeWidth={3.5} strokeOpacity={0.9} {...LINE_PROPS} />
    </Svg>
  );
}

// ── HINGE — deadlift / hip hinge ─────────────────────────────────────────────
function HingeIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      {/* Head */}
      <Circle cx={20} cy={18} r={7} fill="none" stroke={s} strokeWidth={sw} />
      {/* Torso angled forward ~45° */}
      <Line x1={26} y1={22} x2={50} y2={36} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Left arm hanging down + bar */}
      <Line x1={32} y1={26} x2={28} y2={46} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right arm hanging */}
      <Line x1={42} y1={31} x2={38} y2={52} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Bar */}
      <Line x1={20} y1={48} x2={46} y2={54} stroke={s} strokeWidth={3} {...LINE_PROPS} />
      <Circle cx={18} cy={48} r={4} fill="none" stroke={s} strokeWidth={2} />
      <Circle cx={48} cy={55} r={4} fill="none" stroke={s} strokeWidth={2} />
      {/* Hips (pivot point) */}
      <Circle cx={50} cy={36} r={4} fill={color} fillOpacity={0.5} />
      {/* Left thigh straight down */}
      <Line x1={50} y1={40} x2={44} y2={60} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Right thigh */}
      <Line x1={50} y1={40} x2={56} y2={60} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Shins */}
      <Line x1={44} y1={60} x2={42} y2={66} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={56} y1={60} x2={58} y2={66} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      {/* Floor */}
      <Line x1={10} y1={66} x2={66} y2={66} stroke={s} strokeWidth={1.5} strokeOpacity={0.4} {...LINE_PROPS} />
      {/* Muscle highlight — glute/hip area */}
      <Path d="M 50 36 C 56 42 56 52 50 56" fill="none" stroke={color} strokeWidth={3.5} strokeOpacity={0.9} {...LINE_PROPS} />
    </Svg>
  );
}

// ── DEFAULT — generic standing figure ─────────────────────────────────────────
function DefaultIllustration({ color, size = 72 }: IllustrationProps) {
  const s = color + 'CC';
  const sw = 2.8;
  return (
    <Svg viewBox="0 0 72 72" width={size} height={size}>
      <Circle cx={36} cy={14} r={7} fill="none" stroke={s} strokeWidth={sw} />
      <Line x1={36} y1={21} x2={36} y2={46} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={36} y1={28} x2={20} y2={40} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={36} y1={28} x2={52} y2={40} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={36} y1={46} x2={28} y2={62} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={36} y1={46} x2={44} y2={62} stroke={s} strokeWidth={sw} {...LINE_PROPS} />
      <Line x1={14} y1={66} x2={58} y2={66} stroke={s} strokeWidth={1.5} strokeOpacity={0.4} {...LINE_PROPS} />
    </Svg>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
interface ExerciseIllustrationProps {
  type: ExerciseType;
  color: string;
  size?: number;
}

export function ExerciseIllustration({ type, color, size = 72 }: ExerciseIllustrationProps) {
  switch (type) {
    case 'press':      return <PressIllustration color={color} size={size} />;
    case 'pull':       return <PullIllustration color={color} size={size} />;
    case 'squat':      return <SquatIllustration color={color} size={size} />;
    case 'curl':       return <CurlIllustration color={color} size={size} />;
    case 'core':       return <CoreIllustration color={color} size={size} />;
    case 'calf_raise': return <CalfRaiseIllustration color={color} size={size} />;
    case 'shrug':      return <ShrugIllustration color={color} size={size} />;
    case 'hinge':      return <HingeIllustration color={color} size={size} />;
    default:           return <DefaultIllustration color={color} size={size} />;
  }
}
