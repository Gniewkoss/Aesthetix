import { PhysiqueAnalysis, ProgressEntry } from '../types';

export function progressEntryFromAnalysis(analysis: PhysiqueAnalysis, fallbackDate?: string): ProgressEntry {
  return {
    date: analysis.createdAt || fallbackDate || new Date().toISOString(),
    overallScore: analysis.overallScore,
    bodyFat: analysis.bodyFat,
    symmetryScore: analysis.symmetryScore,
    vTaperScore: analysis.vTaperScore,
  };
}

/** Newest-first history → chronological entries for charts. */
export function progressEntriesFromHistory(history: PhysiqueAnalysis[]): ProgressEntry[] {
  return [...history].reverse().map((a) => progressEntryFromAnalysis(a));
}
