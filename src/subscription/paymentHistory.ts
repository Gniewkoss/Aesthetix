import { getPlanById } from './subscription';
import type { Subscription } from './subscription';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'trial' | 'pending';
  description: string;
}

export function buildPaymentHistory(sub: Subscription | null): PaymentRecord[] {
  if (!sub) return [];

  const plan = getPlanById(sub.planId);
  const records: PaymentRecord[] = [];

  records.push({
    id: 'start',
    date: sub.startedAt,
    amount: '$0.00',
    status: 'trial',
    description: 'Subscription started',
  });

  if (sub.status !== 'trialing') {
    records.unshift({
      id: 'last-paid',
      date: sub.cancelledAt ?? sub.startedAt,
      amount: plan.price,
      status: 'paid',
      description: `${plan.name} — ${plan.period}ly`,
    });
  }

  if (sub.autoRenew && sub.status !== 'cancelled' && sub.status !== 'expired') {
    records.unshift({
      id: 'upcoming',
      date: sub.currentPeriodEnd,
      amount: sub.status === 'trialing' ? plan.price : plan.price,
      status: 'pending',
      description: sub.status === 'trialing' ? 'First charge after trial' : 'Upcoming renewal',
    });
  }

  return records.slice(0, 5);
}
