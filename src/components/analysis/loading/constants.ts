import { APP_BRAND } from '../../../constants/brand';

export { APP_BRAND };

export const ANALYSIS_HEADLINE = 'Analyzing physique...';

export const ANALYSIS_SUBTEXTS = [
  'Detecting body landmarks',
  'Measuring symmetry',
  'Calculating proportions',
  'Analyzing muscular balance',
  'Evaluating posture',
  'Generating AI feedback',
] as const;

/** Minimum time on screen so the experience feels intentional, not instant */
export const MIN_LOADING_MS = 4200;

/** Hold at 100% before transitioning to results */
export const COMPLETION_HOLD_MS = 700;

export const SUBTEXT_ROTATE_MS = 3200;

/** Maps backend pipeline steps to user-facing copy */
export const STEP_LABEL_MAP: Record<string, string> = {
  'Initializing...': 'Preparing scan',
  'Preprocessing images...': 'Detecting body landmarks',
  'Extracting visual measurements...': 'Measuring symmetry',
  'Measurements extracted': 'Calculating proportions',
  'Computing scores...': 'Analyzing muscular balance',
  'Analyzing weak points...': 'Evaluating posture',
  'Generating coaching insights...': 'Generating AI feedback',
  'Finalizing report...': 'Finalizing your report',
  'Complete!': 'Analysis complete',
  'Loading mock analysis...': 'Running AI analysis',
};

export function resolveStepLabel(backendStep: string, fallbackIndex: number): string {
  if (backendStep && STEP_LABEL_MAP[backendStep]) {
    return STEP_LABEL_MAP[backendStep];
  }
  return ANALYSIS_SUBTEXTS[fallbackIndex % ANALYSIS_SUBTEXTS.length];
}
