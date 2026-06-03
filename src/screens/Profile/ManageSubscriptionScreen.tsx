import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { SubscriptionOverview } from './subscription/SubscriptionOverview';
import { BillingInfo } from './subscription/BillingInfo';
import { PaymentHistory } from './subscription/PaymentHistory';
import { SubscriptionInfoSection } from './subscription/SubscriptionInfoSection';
import { SubscriptionActions } from './subscription/SubscriptionActions';
import { SubscriptionEmptyState } from './subscription/SubscriptionEmptyState';
import { CancelSubscriptionButton } from './subscription/CancelSubscriptionButton';
import { CancelSubscriptionModal } from './subscription/CancelSubscriptionModal';
import { ChangePlanModal } from './subscription/ChangePlanModal';
import { useManageSubscription } from './subscription/useManageSubscription';
import type { SubscriptionPlanId } from '../../subscription/subscription';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageSubscription'>;

function LoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={C.volt} />
      <Text style={[T.bodySm, { color: C.text3 }]}>Loading subscription…</Text>
    </View>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={18} color={C.danger} />
      <Text style={[T.bodySm, { color: C.text, flex: 1 }]}>{message}</Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color={C.text3} />
      </Pressable>
    </View>
  );
}

export function ManageSubscriptionScreen({ navigation, route }: Props) {
  const pendingImageUris = route.params?.pendingImageUris;
  const willContinueScan = (pendingImageUris?.length ?? 0) > 0;

  const {
    user, hydrated, subscription, loading, error, displayStatus, isPremium, hasSubscription,
    canCancel, billing, payments, paymentMethod, statusLabel,
    showChangePlan, setShowChangePlan, showCancelModal, setShowCancelModal,
    handleManagePayment, handleChangePlan, handleCancel, handleReactivate, handleRestore,
    handleSubscribePlan, clearError,
  } = useManageSubscription();

  const continueAfterPurchase = useCallback(() => {
    if (willContinueScan && pendingImageUris) {
      navigation.replace('AnalysisLoading', { imageUris: pendingImageUris });
    }
  }, [navigation, willContinueScan, pendingImageUris]);

  const afterPurchase = willContinueScan ? continueAfterPurchase : undefined;

  const handlePlanConfirm = (planId: SubscriptionPlanId) => {
    if (hasSubscription) {
      handleChangePlan(planId);
    } else {
      handleSubscribePlan(planId, afterPurchase);
    }
  };

  const showReactivate =
    hasSubscription && subscription?.status === 'cancelled' && subscription?.autoRenew === false;

  if (!hydrated && user) {
    return (
      <View style={styles.root}>
        <AmbientGlow />
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <ScreenHeader title="Subscription" onBack={() => navigation.goBack()} />
          <LoadingState />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Subscription" subtitle={statusLabel} onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onDismiss={clearError} />}

          <Animated.View entering={FadeInDown.duration(300)}>
            <SubscriptionOverview displayStatus={displayStatus} subscription={subscription} isPremium={isPremium} />
          </Animated.View>

          {hasSubscription ? (
            <>
              <Animated.View entering={FadeInDown.delay(40).duration(300)}>
                <BillingInfo
                  nextBillingLabel={billing.label}
                  nextBillingDate={billing.date}
                  paymentMethod={paymentMethod}
                  autoRenew={subscription?.autoRenew ?? false}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(80).duration(300)}>
                <SubscriptionActions
                  showChangePlan
                  showReactivate={showReactivate}
                  loading={loading}
                  onChangePlan={() => setShowChangePlan(true)}
                  onManagePayment={handleManagePayment}
                  onReactivate={handleReactivate}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(120).duration(300)}>
                <PaymentHistory payments={payments} />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(160).duration(300)}>
                <SubscriptionInfoSection
                  periodEndDate={subscription?.currentPeriodEnd ?? null}
                  showCancelInfo={canCancel || showReactivate}
                />
              </Animated.View>

              {canCancel && (
                <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                  <CancelSubscriptionButton onPress={() => setShowCancelModal(true)} disabled={loading} />
                </Animated.View>
              )}
            </>
          ) : (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                <SubscriptionEmptyState
                  onSubscribe={(planId) => handleSubscribePlan(planId, afterPurchase)}
                  loading={loading}
                />
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                <PaymentHistory payments={[]} />
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(140).duration(300)}>
                <SubscriptionInfoSection periodEndDate={null} showCancelInfo={false} />
              </Animated.View>
            </>
          )}

          <Pressable onPress={handleRestore} disabled={loading} style={styles.footerLink}>
            <Text style={[T.label, { color: C.text3 }]}>Restore purchases</Text>
          </Pressable>
        </ScrollView>

        <ChangePlanModal
          visible={showChangePlan}
          currentPlanId={(subscription?.planId ?? 'monthly') as SubscriptionPlanId}
          loading={loading}
          showCancelSubscription={canCancel}
          onClose={() => setShowChangePlan(false)}
          onConfirm={handlePlanConfirm}
          onCancelSubscription={() => {
            setShowChangePlan(false);
            setShowCancelModal(true);
          }}
        />

        <CancelSubscriptionModal
          visible={showCancelModal}
          periodEnd={subscription?.currentPeriodEnd ?? null}
          loading={loading}
          onConfirm={handleCancel}
          onCancel={() => setShowCancelModal(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: 'rgba(255,92,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,92,0.28)',
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.base,
  },
  footerLink: { alignItems: 'center', paddingVertical: S.xl },
});
