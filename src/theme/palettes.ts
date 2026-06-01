export type ColorPalette = {
  cream: string;
  creamDim: string;
  creamBorder: string;
  creamStrong: string;
  bg: { primary: string; secondary: string; card: string; elevated: string };
  accent: string;
  accentDim: string;
  accentBorder: string;
  indigo: string;
  indigoDim: string;
  indigoBorder: string;
  green: string;
  greenDim: string;
  greenBorder: string;
  amber: string;
  amberDim: string;
  amberBorder: string;
  red: string;
  redDim: string;
  redBorder: string;
  purple: string;
  purpleDim: string;
  purpleBorder: string;
  cyan: string;
  cyanDim: string;
  cyanBorder: string;
  pink: string;
  pinkDim: string;
  pinkBorder: string;
  orange: string;
  orangeDim: string;
  yellow: string;
  yellowDim: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    onAccent: string;
  };
  border: { hairline: string; subtle: string; default: string; strong: string };
  glass: { bg: string; border: string; bgStrong: string; borderStrong: string };
  score: { elite: string; great: string; good: string; average: string; poor: string };
};

export const DARK_COLORS: ColorPalette = {
  cream: '#ECECE6',
  creamDim: 'rgba(236,236,230,0.07)',
  creamBorder: 'rgba(236,236,230,0.13)',
  creamStrong: 'rgba(236,236,230,0.18)',
  bg: {
    primary: '#060609',
    secondary: '#0B0B0F',
    card: '#0F0F15',
    elevated: '#161620',
  },
  accent: '#3B82F6',
  accentDim: 'rgba(59,130,246,0.08)',
  accentBorder: 'rgba(59,130,246,0.18)',
  indigo: '#6366F1',
  indigoDim: 'rgba(99,102,241,0.08)',
  indigoBorder: 'rgba(99,102,241,0.18)',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.08)',
  greenBorder: 'rgba(34,197,94,0.20)',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.08)',
  amberBorder: 'rgba(245,158,11,0.20)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.08)',
  redBorder: 'rgba(239,68,68,0.20)',
  purple: '#6366F1',
  purpleDim: 'rgba(99,102,241,0.08)',
  purpleBorder: 'rgba(99,102,241,0.18)',
  cyan: '#3B82F6',
  cyanDim: 'rgba(59,130,246,0.08)',
  cyanBorder: 'rgba(59,130,246,0.18)',
  pink: '#EF4444',
  pinkDim: 'rgba(239,68,68,0.08)',
  pinkBorder: 'rgba(239,68,68,0.20)',
  orange: '#F59E0B',
  orangeDim: 'rgba(245,158,11,0.08)',
  yellow: '#F59E0B',
  yellowDim: 'rgba(245,158,11,0.08)',
  text: {
    primary: '#ECECE6',
    secondary: 'rgba(236,236,230,0.55)',
    muted: 'rgba(236,236,230,0.32)',
    disabled: 'rgba(236,236,230,0.16)',
    onAccent: '#FFFFFF',
  },
  border: {
    hairline: 'rgba(255,255,255,0.06)',
    subtle: 'rgba(255,255,255,0.09)',
    default: 'rgba(255,255,255,0.13)',
    strong: 'rgba(255,255,255,0.20)',
  },
  glass: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.09)',
    bgStrong: 'rgba(255,255,255,0.07)',
    borderStrong: 'rgba(255,255,255,0.14)',
  },
  score: {
    elite: '#22C55E',
    great: '#3B82F6',
    good: '#8B5CF6',
    average: '#F59E0B',
    poor: '#EF4444',
  },
};

export const LIGHT_COLORS: ColorPalette = {
  ...DARK_COLORS,
  cream: '#1A1A18',
  creamDim: 'rgba(26,26,24,0.06)',
  creamBorder: 'rgba(26,26,24,0.12)',
  creamStrong: 'rgba(26,26,24,0.16)',
  bg: {
    primary: '#F5F5F2',
    secondary: '#EBEBE6',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#121214',
    secondary: 'rgba(18,18,20,0.65)',
    muted: 'rgba(18,18,20,0.45)',
    disabled: 'rgba(18,18,20,0.28)',
    onAccent: '#FFFFFF',
  },
  border: {
    hairline: 'rgba(0,0,0,0.06)',
    subtle: 'rgba(0,0,0,0.09)',
    default: 'rgba(0,0,0,0.12)',
    strong: 'rgba(0,0,0,0.18)',
  },
  glass: {
    bg: 'rgba(255,255,255,0.72)',
    border: 'rgba(0,0,0,0.08)',
    bgStrong: 'rgba(255,255,255,0.92)',
    borderStrong: 'rgba(0,0,0,0.12)',
  },
};

export type GradientPalette = {
  primary: readonly [string, string];
  premium: readonly [string, string];
  success: readonly [string, string];
  danger: readonly [string, string];
  dark: readonly [string, string];
  card: readonly [string, string];
  cream: readonly [string, string, string];
  diagonalBlue: readonly [string, string, string];
  diagonalCream: readonly [string, string, string];
  score: {
    elite: readonly [string, string];
    great: readonly [string, string];
    good: readonly [string, string];
    average: readonly [string, string];
    poor: readonly [string, string];
  };
};

export const DARK_GRADIENTS: GradientPalette = {
  primary: ['#1E40AF', '#3B82F6'],
  premium: ['#4338CA', '#6366F1'],
  success: ['#15803D', '#22C55E'],
  danger: ['#B91C1C', '#EF4444'],
  dark: ['#161620', '#0F0F15'],
  card: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
  cream: ['rgba(236,236,230,0.14)', 'rgba(236,236,230,0.02)', 'transparent'],
  diagonalBlue: ['rgba(59,130,246,0.18)', 'rgba(99,102,241,0.06)', 'transparent'],
  diagonalCream: ['rgba(236,236,230,0.10)', 'rgba(236,236,230,0.02)', 'transparent'],
  score: {
    elite: ['#15803D', '#22C55E'],
    great: ['#1E40AF', '#3B82F6'],
    good: ['#5B21B6', '#8B5CF6'],
    average: ['#B45309', '#F59E0B'],
    poor: ['#B91C1C', '#EF4444'],
  },
};

export const LIGHT_GRADIENTS: GradientPalette = {
  ...DARK_GRADIENTS,
  dark: ['#EBEBE6', '#F5F5F2'],
  card: ['rgba(255,255,255,0.95)', 'rgba(245,245,242,0.9)'],
  cream: ['rgba(26,26,24,0.08)', 'rgba(26,26,24,0.02)', 'transparent'],
};
