import { supabase, isSupabaseConfigured } from '../api/supabase';
import {
  Subscription,
  SubscriptionPlanId,
  SubscriptionStatus,
} from './subscription';

interface ServerSubscriptionRow {
  product_id: string | null;
  status: string;
  is_trial: boolean;
  will_renew: boolean;
  current_period_end: string | null;
  updated_at: string;
}

function planIdFromProductId(productId: string | null): SubscriptionPlanId {
  if (!productId) return 'monthly';
  const id = productId.toLowerCase();
  if (id.includes('week')) return 'weekly';
  if (id.includes('year') || id.includes('annual')) return 'yearly';
  return 'monthly';
}

function mapServerRow(row: ServerSubscriptionRow): Subscription | null {
  const periodEnd = row.current_period_end;
  if (!periodEnd) return null;

  const endMs = new Date(periodEnd).getTime();
  const active = row.status === 'active' && endMs > Date.now();
  if (!active) {
    return {
      planId: planIdFromProductId(row.product_id),
      status: 'expired',
      startedAt: row.updated_at,
      currentPeriodEnd: periodEnd,
      autoRenew: false,
    };
  }

  let status: SubscriptionStatus = 'active';
  if (row.is_trial) status = 'trialing';
  else if (!row.will_renew) status = 'cancelled';

  return {
    planId: planIdFromProductId(row.product_id),
    status,
    startedAt: row.updated_at,
    currentPeriodEnd: periodEnd,
    autoRenew: row.will_renew,
    trialEndsAt: row.is_trial ? periodEnd : undefined,
    cancelledAt: !row.will_renew ? row.updated_at : undefined,
  };
}

export async function fetchSubscriptionFromServer(
  userId: string,
): Promise<Subscription | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('product_id, status, is_trial, will_renew, current_period_end, updated_at')
    .eq('user_id', userId)
    .maybeSingle<ServerSubscriptionRow>();

  if (error || !data) return null;
  return mapServerRow(data);
}
