import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSubscriptionStore } from '../../../store/useSubscriptionStore';
import { buildPaymentHistory } from '../../../subscription/paymentHistory';
import {
  getNextBillingLabel,
  getStatusLabel,
  getSubscriptionDisplayStatus,
  isSubscriptionActive,
  type SubscriptionPlanId,
} from '../../../subscription/subscription';

const STORE_SUBSCRIPTION_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

export function useManageSubscription() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useSubscriptionStore((s) => s.hydrated);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const subscribe = useSubscriptionStore((s) => s.subscribe);
  const changePlan = useSubscriptionStore((s) => s.changePlan);
  const cancelSubscription = useSubscriptionStore((s) => s.cancelSubscription);
  const reactivateAutoRenew = useSubscriptionStore((s) => s.reactivateAutoRenew);
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);
  const hydrateSubscription = useSubscriptionStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated && user?.id) {
      void hydrateSubscription(user.id);
    }
  }, [hydrated, user?.id, hydrateSubscription]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const displayStatus = getSubscriptionDisplayStatus(subscription);
  const isActive = isSubscriptionActive(subscription);
  const isPremium = !!(user?.isPremium && isActive);
  const hasSubscription = isPremium && !!subscription;
  const canCancel =
    hasSubscription && subscription!.status !== 'cancelled' && subscription!.autoRenew;

  const billing = useMemo(
    () => getNextBillingLabel(subscription, displayStatus),
    [subscription, displayStatus],
  );

  const payments = useMemo(() => buildPaymentHistory(subscription), [subscription]);

  const paymentMethod =
    Platform.OS === 'ios' ? 'Apple Pay · App Store' : 'Google Play Billing';

  const run = useCallback(async (fn: () => Promise<void>, successMsg?: string) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      if (successMsg) Alert.alert('Done', successMsg);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleManagePayment = useCallback(() => {
    Linking.openURL(STORE_SUBSCRIPTION_URL).catch(() => {
      Alert.alert(
        'Billing portal',
        Platform.OS === 'ios'
          ? 'Open Settings → Apple ID → Subscriptions.'
          : 'Open Google Play → Payments & subscriptions.',
      );
    });
  }, []);

  const handleChangePlan = useCallback(
    (planId: SubscriptionPlanId) => {
      void run(async () => {
        await changePlan(planId);
        setShowChangePlan(false);
      }, 'Your plan has been updated.');
    },
    [changePlan, run],
  );

  const handleCancel = useCallback(() => {
    void run(async () => {
      await cancelSubscription();
      setShowCancelModal(false);
    }, 'Auto-renew is off. Premium remains until your current period ends.');
  }, [cancelSubscription, run]);

  const handleReactivate = useCallback(() => {
    void run(async () => {
      await reactivateAutoRenew();
    }, 'Auto-renew is back on.');
  }, [reactivateAutoRenew, run]);

  const handleRestore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await restorePurchases();
      Alert.alert(result.restored ? 'Restored' : 'Nothing to restore', result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restore failed.';
      setError(message);
      Alert.alert('Restore failed', message);
    } finally {
      setLoading(false);
    }
  }, [restorePurchases]);

  const handleStartTrial = useCallback(
    (planId: SubscriptionPlanId = 'monthly') => {
      void run(async () => {
        await subscribe(planId);
      }, 'Your free trial has started.');
    },
    [subscribe, run],
  );

  // Treat as ready when no user (shouldn't happen) or after hydrate completes
  const isReady = hydrated || !user?.id;

  return {
    user,
    hydrated: isReady,
    subscription,
    loading,
    error,
    displayStatus,
    isPremium,
    hasSubscription,
    canCancel,
    billing,
    payments,
    paymentMethod,
    statusLabel: getStatusLabel(subscription, !!user?.isPremium),
    showChangePlan,
    setShowChangePlan,
    showCancelModal,
    setShowCancelModal,
    handleManagePayment,
    handleChangePlan,
    handleCancel,
    handleReactivate,
    handleRestore,
    handleStartTrial,
    clearError: () => setError(null),
  };
}
