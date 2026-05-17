import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 'scan'  → show "tap Start AI Scan" coach bubble on HomeScreen
// 'tabs'  → show "explore the bottom nav" bubble after first scan
// 'done'  → no more bubbles; checklist still visible until dismissed
export type CoachStep = 'scan' | 'tabs' | 'done';

interface OnboardingStore {
  coachStep: CoachStep;
  checklistDismissed: boolean;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  advanceCoach: () => void;
  markFirstScanDone: () => void;
  dismissChecklist: () => void;
}

const COACH_KEY = '@physiquemax/coach_step';
const CHECKLIST_KEY = '@physiquemax/checklist_dismissed';

const STEP_AFTER: Record<CoachStep, CoachStep> = {
  scan: 'tabs',
  tabs: 'done',
  done: 'done',
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  coachStep: 'scan',
  checklistDismissed: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [stepRaw, dismissedRaw] = await Promise.all([
        AsyncStorage.getItem(COACH_KEY),
        AsyncStorage.getItem(CHECKLIST_KEY),
      ]);
      set({
        coachStep: (stepRaw as CoachStep | null) ?? 'scan',
        checklistDismissed: dismissedRaw === 'true',
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  advanceCoach: () => {
    const next = STEP_AFTER[get().coachStep];
    void AsyncStorage.setItem(COACH_KEY, next);
    set({ coachStep: next });
  },

  // Called when the user completes their first scan — jumps coach to 'tabs' step
  markFirstScanDone: () => {
    if (get().coachStep === 'scan') {
      void AsyncStorage.setItem(COACH_KEY, 'tabs');
      set({ coachStep: 'tabs' });
    }
  },

  dismissChecklist: () => {
    void AsyncStorage.setItem(CHECKLIST_KEY, 'true');
    set({ checklistDismissed: true });
  },
}));
