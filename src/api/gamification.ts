import { supabase } from './supabase';

export type ShareBonusResult = {
  awarded: boolean;
  xp: number;
  xp_awarded?: number;
  reason?: string;
};

/** Server-authoritative daily share XP (30). */
export async function claimShareBonus(): Promise<ShareBonusResult> {
  const { data, error } = await supabase.rpc('claim_share_bonus');
  if (error) throw new Error(error.message);
  return data as ShareBonusResult;
}
