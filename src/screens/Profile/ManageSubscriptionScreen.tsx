import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/common/ScreenHeader';
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
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../theme';
import type { SubscriptionPlanId } from '../../subscription/subscription';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageSubscription'>;

function LoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={styles.loadingText}>Loading subscription…</Text>
    </View>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={18} color={COLORS.red} />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color={COLORS.text.muted} />
      </TouchableOpacity>
    </View>
  );
}

export function ManageSubscriptionScreen({ navigation }: Props) {
  const {
    user,
    hydrated,
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
    statusLabel,
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
    clearError,
  } = useManageSubscription();

  const showReactivate =
    hasSubscription && subscription?.status === 'cancelled' && subscription?.autoRenew === false;

  if (!hydrated && user) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.flex} edges={['bottom']}>
          <ScreenHeader title="Subscription" onBack={() => navigation.goBack()} />
          <LoadingState />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScreenHeader
          title="Subscription"
          subtitle={statusLabel}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {error && <ErrorBanner message={error} onDismiss={clearError} />}

          {/* 1. Plan + status (primary) */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <SubscriptionOverview
              displayStatus={displayStatus}
              subscription={subscription}
              isPremium={isPremium}
            />
          </Animated.View>

          {hasSubscription ? (
            <>
              {/* 2. Billing (secondary) */}
              <Animated.View entering={FadeInDown.delay(40).duration(300)}>
                <BillingInfo
                  nextBillingLabel={billing.label}
                  nextBillingDate={billing.date}
                  paymentMethod={paymentMethod}
                  autoRenew={subscription?.autoRenew ?? false}
                />
              </Animated.View>

              {/* Primary actions */}
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

              {/* 3. Payment history (tertiary) */}
              <Animated.View entering={FadeInDown.delay(120).duration(300)}>
                <PaymentHistory payments={payments} />
              </Animated.View>

              {/* Info section */}
              <Animated.View entering={FadeInDown.delay(160).duration(300)}>
                <SubscriptionInfoSection
                  periodEndDate={subscription?.currentPeriodEnd ?? null}
                  showCancelInfo={canCancel || showReactivate}
                />
              </Animated.View>

              {/* Cancel — subtle, non-dominant */}
              {canCancel && (
                <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                  <CancelSubscriptionButton
                    onPress={() => setShowCancelModal(true)}
                    disabled={loading}
                  />
                </Animated.View>
              )}
            </>
          ) : (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                <SubscriptionEmptyState
                  onStartTrial={() => handleStartTrial('monthly')}
                  onViewPlans={() => navigation.navigate('Premium')}
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

          {/* Footer utilities */}
          <TouchableOpacity
            onPress={handleRestore}
            style={styles.footerLink}
            disabled={loading}
          >
            <Text style={styles.footerLinkText}>Restore purchases</Text>
          </TouchableOpacity>
        </ScrollView>

        <ChangePlanModal
          visible={showChangePlan}
          currentPlanId={(subscription?.planId ?? 'monthly') as SubscriptionPlanId}
          loading={loading}
          onClose={() => setShowChangePlan(false)}
          onConfirm={handleChangePlan}
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
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.redDim,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  errorText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.primary,
  },
  footerLink: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerLinkText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.disabled,
  },
});
