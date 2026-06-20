/**
 * Unit tests for refreshPremiumFromServer — the server reconciliation that fixes the
 * "expired subscription stays Premium in-session" leak (HIGH #3) while keeping Premium
 * lit immediately after a purchase via the optimistic device-entitlement floor.
 *
 * The module pulls in react-native / supabase / the auth store, so we mock those — the
 * jest project is a framework-free node env (see jest.config.js).
 */

// React Native injects __DEV__ globally; the node test env does not.
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

// react-native is not loadable in the node test env — only Platform is referenced.
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

// Controllable profiles row returned by supabase.from('profiles')...single().
let mockProfileRow: { is_premium: boolean; subscription_tier: string | null } | null = null;
let mockProfileError: { message: string } | null = null;

jest.mock('../../api/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: mockProfileRow, error: mockProfileError }),
        }),
      }),
    }),
  },
}));

// Minimal in-memory auth store standing in for zustand.
const mockAuthState: { user: Record<string, unknown> | null } = { user: null };
jest.mock('../../store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => mockAuthState,
    setState: (partial: Record<string, unknown>) => {
      Object.assign(mockAuthState, partial);
    },
  },
}));

jest.mock('../../lib/errorTracking', () => ({ trackEvent: jest.fn() }));

import { refreshPremiumFromServer } from '../purchases';

function setUser(tier: string, isPremium: boolean) {
  mockAuthState.user = {
    id: 'user-1',
    subscriptionTier: tier,
    isPremium,
    maxScansPerDay: isPremium ? 999 : 1,
  };
}

beforeEach(() => {
  mockProfileRow = null;
  mockProfileError = null;
  mockAuthState.user = null;
});

describe('refreshPremiumFromServer', () => {
  it('downgrades an in-session Premium user once the server reports free (expired sub)', async () => {
    setUser('pro', true);
    mockProfileRow = { is_premium: false, subscription_tier: 'free' };

    const stillPaid = await refreshPremiumFromServer(); // no device entitlement floor

    expect(stillPaid).toBe(false);
    expect(mockAuthState.user).toMatchObject({
      subscriptionTier: 'free',
      isPremium: false,
      maxScansPerDay: 1,
    });
  });

  it('keeps Premium lit via the optimistic floor while the webhook is still in flight', async () => {
    setUser('free', false);
    // Server has not flipped yet (webhook pending) but the device entitlement is active.
    mockProfileRow = { is_premium: false, subscription_tier: 'free' };

    const serverConfirmed = await refreshPremiumFromServer('pro'); // floor = active RC tier

    // Server is not yet confirmed...
    expect(serverConfirmed).toBe(false);
    // ...but the user stays Premium so the UI/scan don't regress post-purchase.
    expect(mockAuthState.user).toMatchObject({
      subscriptionTier: 'pro',
      isPremium: true,
      maxScansPerDay: 999,
    });
  });

  it('adopts a higher server tier authoritatively (e.g. promo grant) with no floor', async () => {
    setUser('free', false);
    mockProfileRow = { is_premium: true, subscription_tier: 'max' };

    const paid = await refreshPremiumFromServer();

    expect(paid).toBe(true);
    expect(mockAuthState.user).toMatchObject({
      subscriptionTier: 'max',
      isPremium: true,
    });
  });

  it('does not downgrade below the floor when the server lags behind a max entitlement', async () => {
    setUser('max', true);
    mockProfileRow = { is_premium: true, subscription_tier: 'pro' }; // server slightly behind

    await refreshPremiumFromServer('max');

    expect(mockAuthState.user).toMatchObject({ subscriptionTier: 'max', isPremium: true });
  });

  it('returns false and leaves state untouched when there is no signed-in user', async () => {
    mockAuthState.user = null;

    const result = await refreshPremiumFromServer('pro');

    expect(result).toBe(false);
    expect(mockAuthState.user).toBeNull();
  });

  it('falls back to the local tier when the profile read errors', async () => {
    setUser('pro', true);
    mockProfileError = { message: 'network down' };

    const result = await refreshPremiumFromServer();

    // No authoritative server value → keep current paid access, report it as paid.
    expect(result).toBe(true);
    expect(mockAuthState.user).toMatchObject({ subscriptionTier: 'pro', isPremium: true });
  });
});
