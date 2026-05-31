import {
  Subscription,
  SubscriptionPlanId,
  TRIAL_DAYS,
  addPeriod,
  computeTrialEnd,
  isSubscriptionActive,
  normalizeSubscription,
  getSubscriptionDisplayStatus,
  getStatusLabel,
  getNextBillingLabel,
} from '../subscription';

const DAY = 24 * 60 * 60 * 1000;

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  const now = new Date();
  return {
    planId: 'monthly',
    status: 'active',
    startedAt: now.toISOString(),
    currentPeriodEnd: new Date(now.getTime() + 30 * DAY).toISOString(),
    autoRenew: true,
    ...overrides,
  };
}

describe('addPeriod', () => {
  const base = new Date('2026-01-01T00:00:00.000Z');
  it.each<[SubscriptionPlanId, string]>([
    ['weekly', '2026-01-08'],
    ['monthly', '2026-02-01'],
    ['yearly', '2027-01-01'],
  ])('advances a %s plan correctly', (plan, expectedDatePrefix) => {
    expect(addPeriod(base, plan).toISOString().startsWith(expectedDatePrefix)).toBe(true);
  });

  it('does not mutate the input date', () => {
    const copy = new Date(base);
    addPeriod(base, 'yearly');
    expect(base.getTime()).toBe(copy.getTime());
  });
});

describe('computeTrialEnd', () => {
  it(`returns a date ${TRIAL_DAYS} days out`, () => {
    const from = new Date('2026-05-01T12:00:00.000Z');
    const end = computeTrialEnd(from);
    expect(Math.round((end.getTime() - from.getTime()) / DAY)).toBe(TRIAL_DAYS);
  });
});

describe('isSubscriptionActive', () => {
  it('is false for null/undefined', () => {
    expect(isSubscriptionActive(null)).toBe(false);
    expect(isSubscriptionActive(undefined)).toBe(false);
  });
  it('is false for none/expired status', () => {
    expect(isSubscriptionActive(makeSub({ status: 'none' }))).toBe(false);
    expect(isSubscriptionActive(makeSub({ status: 'expired' }))).toBe(false);
  });
  it('is false once the period end is in the past', () => {
    expect(
      isSubscriptionActive(makeSub({ currentPeriodEnd: new Date(Date.now() - DAY).toISOString() })),
    ).toBe(false);
  });
  it('is true for an active sub with a future period end', () => {
    expect(isSubscriptionActive(makeSub())).toBe(true);
  });
  it('is true while trialing with a future period end', () => {
    expect(isSubscriptionActive(makeSub({ status: 'trialing' }))).toBe(true);
  });
  it('is true for a cancelled-but-not-yet-expired sub (access until period end)', () => {
    expect(isSubscriptionActive(makeSub({ status: 'cancelled', autoRenew: false }))).toBe(true);
  });
});

describe('normalizeSubscription', () => {
  it('returns null for null input', () => {
    expect(normalizeSubscription(null)).toBeNull();
  });
  it('marks an elapsed sub as expired and disables auto-renew', () => {
    const stale = makeSub({ currentPeriodEnd: new Date(Date.now() - DAY).toISOString() });
    const normalized = normalizeSubscription(stale);
    expect(normalized?.status).toBe('expired');
    expect(normalized?.autoRenew).toBe(false);
  });
  it('leaves an active sub untouched', () => {
    const sub = makeSub();
    expect(normalizeSubscription(sub)).toBe(sub);
  });
});

describe('getSubscriptionDisplayStatus', () => {
  it('reports none when there is no sub', () => {
    expect(getSubscriptionDisplayStatus(null)).toBe('none');
    expect(getSubscriptionDisplayStatus(makeSub({ status: 'expired' }))).toBe('none');
  });
  it('reports active for a renewing sub', () => {
    expect(getSubscriptionDisplayStatus(makeSub())).toBe('active');
  });
  it('reports expiring for a cancelled sub still within its period', () => {
    expect(getSubscriptionDisplayStatus(makeSub({ status: 'cancelled', autoRenew: false }))).toBe(
      'expiring',
    );
  });
  it('reports expiring when auto-renew is off', () => {
    expect(getSubscriptionDisplayStatus(makeSub({ autoRenew: false }))).toBe('expiring');
  });
});

describe('getStatusLabel', () => {
  it('falls back to Premium/Free when there is no sub object', () => {
    expect(getStatusLabel(null, true)).toBe('Premium');
    expect(getStatusLabel(null, false)).toBe('Free plan');
  });
  it('labels a trial as Free trial', () => {
    expect(getStatusLabel(makeSub({ status: 'trialing' }), true)).toBe('Free trial');
  });
  it('labels an active sub as Active', () => {
    expect(getStatusLabel(makeSub(), true)).toBe('Active');
  });
});

describe('getNextBillingLabel', () => {
  it('shows the first charge date while trialing', () => {
    const trialEnd = new Date(Date.now() + 2 * DAY).toISOString();
    const sub = makeSub({ status: 'trialing', trialEndsAt: trialEnd });
    const result = getNextBillingLabel(sub, 'active');
    expect(result.label).toBe('First charge on');
    expect(result.date).toBe(trialEnd);
  });
  it('shows access-ends for an expiring sub', () => {
    const sub = makeSub({ autoRenew: false });
    const result = getNextBillingLabel(sub, 'expiring');
    expect(result.label).toBe('Access ends');
    expect(result.date).toBe(sub.currentPeriodEnd);
  });
  it('shows next renewal for an active sub', () => {
    const sub = makeSub();
    expect(getNextBillingLabel(sub, 'active').label).toBe('Next renewal');
  });
  it('returns no date when there is no sub', () => {
    expect(getNextBillingLabel(null, 'none').date).toBeNull();
  });
});
