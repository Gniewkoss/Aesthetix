import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation/types';
import { PREMIUM_PLANS } from '../../constants';
import { C, T, R, S, LAYOUT, E } from '../../theme/obsidian';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useManageSubscription } from '../Profile/subscription/useManageSubscription';
import type { SubscriptionPlanId } from '../../subscription/subscription';
import {
  badgeForPlan,
  getUpgradeCopy,
  paywallPlanOrder,
  suggestedPlanForReason,
  tierMeetsReason,
} from '../../subscription/upgradeReasons';
import type { UpgradeReason } from '../../subscription/upgradeReasons';
import { PlanOfferCard, planById } from './paywall/PlanOfferCard';
import { tierFromPlanId } from '../../subscription/tiers';

type Props = NativeStackScreenProps<RootStackParamList, 'UpgradePaywall'>;

const HERO_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  scan: 'scan-outline',
  body: 'body-outline',
  chat: 'chatbubbles-outline',
  sparkles: 'sparkles',
};

const TRUST_ITEMS = [
  { icon: 'shield-checkmark-outline' as const, label: 'Secure checkout' },
  { icon: 'refresh-outline' as const, label: 'Cancel anytime' },
  { icon: 'trending-up-outline' as const, label: 'Instant unlock' },
];

export function UpgradePaywallScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const reason = route.params?.reason as UpgradeReason | undefined;
  const pendingImageUris = route.params?.pendingImageUris;
  const tier = useAuthStore((s) => s.user?.subscriptionTier ?? 'free');

  const copy = getUpgradeCopy(reason);
  const planOrder = useMemo(() => paywallPlanOrder(reason, tier), [reason, tier]);
  const defaultPlan = route.params?.suggestedPlan ?? suggestedPlanForReason(reason);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    planOrder.includes(defaultPlan) ? defaultPlan : planOrder[0],
  );

  const { loading, error, handleSubscribePlan, handleRestore, clearError } = useManageSubscription();

  const willContinueScan = (pendingImageUris?.length ?? 0) > 0;

  const continueAfterPurchase = useCallback(() => {
    if (willContinueScan && pendingImageUris) {
      navigation.replace('AnalysisLoading', { imageUris: pendingImageUris });
    } else {
      navigation.goBack();
    }
  }, [navigation, willContinueScan, pendingImageUris]);

  const selectedMeta = planById(selectedPlan);
  const ctaLabel = `Continue with ${selectedMeta.name}`;

  const onSubscribe = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSubscribePlan(
      selectedPlan,
      willContinueScan ? continueAfterPurchase : () => navigation.goBack(),
    );
  };

  if (tierMeetsReason(tier, reason)) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.alreadyWrap}>
            <Ionicons name="checkmark-circle" size={48} color={C.volt} />
            <Text style={[T.title, { color: C.text, textAlign: 'center', marginTop: S.lg }]}>
              You’re all set
            </Text>
            <Text style={[T.body, { color: C.text2, textAlign: 'center', marginTop: S.sm }]}>
              Your current plan already includes this feature.
            </Text>
            <ObsButton title="Go back" onPress={() => navigation.goBack()} style={{ marginTop: S.xl }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={[styles.close, { top: insets.top + S.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={C.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <View style={[styles.heroIcon, E.glow]}>
              <Ionicons name={HERO_ICONS[copy.heroIcon]} size={28} color={C.voltInk} />
            </View>
            <Text style={[T.h1, styles.headline, { color: C.text }]}>{copy.headline}</Text>
            <Text style={[T.body, { color: C.text2, textAlign: 'center', lineHeight: 24 }]}>
              {copy.subheadline}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.trustRow}>
            {TRUST_ITEMS.map((item) => (
              <View key={item.label} style={styles.trustItem}>
                <Ionicons name={item.icon} size={14} color={C.volt} />
                <Text style={[T.caption, { color: C.text3 }]}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>

          {error ? (
            <Pressable onPress={clearError} style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={C.danger} />
              <Text style={[T.bodySm, { color: C.text, flex: 1 }]}>{error}</Text>
            </Pressable>
          ) : null}

          <Animated.View entering={FadeInDown.delay(140).duration(400)}>
            <Text style={[T.overline, { color: C.text3, marginBottom: S.md }]}>CHOOSE YOUR PLAN</Text>
            {planOrder.map((planId) => {
              const plan = PREMIUM_PLANS.find((p) => p.id === planId)!;
              const isCurrent = tier === tierFromPlanId(planId);
              return (
                <PlanOfferCard
                  key={planId}
                  plan={plan}
                  selected={selectedPlan === planId}
                  featured={planOrder[0] === planId}
                  badge={isCurrent ? 'CURRENT' : badgeForPlan(planId, planOrder)}
                  disabled={isCurrent}
                  onPress={() => {
                    if (isCurrent) return;
                    void Haptics.selectionAsync();
                    setSelectedPlan(planId);
                  }}
                />
              );
            })}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.compareCard}>
            <Text style={[T.label, { color: C.text, marginBottom: S.sm }]}>Why athletes upgrade</Text>
            {[
              'Track real physique changes week to week',
              'Back + front scoring for balanced development',
              'Max adds an AI coach that knows your numbers',
            ].map((line) => (
              <View key={line} style={styles.compareRow}>
                <View style={styles.compareDot} />
                <Text style={[T.bodySm, { color: C.text2, flex: 1 }]}>{line}</Text>
              </View>
            ))}
          </Animated.View>

          <Pressable
            onPress={() => navigation.navigate('ManageSubscription')}
            style={styles.manageLink}
          >
            <Text style={[T.caption, { color: C.text3 }]}>
              Already subscribed? Manage billing
            </Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
          <ObsButton
            title={loading ? 'Processing…' : ctaLabel}
            onPress={onSubscribe}
            loading={loading}
            glow
            icon="flash"
            style={{ height: 56 }}
          />
          <Text style={[T.caption, { color: C.text3, textAlign: 'center', marginTop: S.sm }]}>
            {selectedMeta.price}/{selectedMeta.period === 'week' ? 'week' : 'month'} · Billed through App Store / Play
          </Text>
          <Pressable onPress={handleRestore} disabled={loading} style={styles.restore}>
            <Text style={[T.caption, { color: C.text3 }]}>Restore purchases</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} style={styles.later}>
            <Text style={[T.label, { color: C.text2 }]}>Maybe later</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  safe: { flex: 1 },
  close: {
    position: 'absolute',
    right: LAYOUT.screenX,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: R.pill,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S['3xl'],
  },
  hero: {
    alignItems: 'center',
    marginBottom: S.xl,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: R.xl,
    backgroundColor: C.volt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.lg,
  },
  headline: {
    textAlign: 'center',
    marginBottom: S.md,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: S.xl,
    paddingHorizontal: S.xs,
  },
  trustItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
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
  compareCard: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginTop: S.sm,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
    marginTop: S.sm,
  },
  compareDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.volt,
    marginTop: 7,
  },
  manageLink: {
    alignItems: 'center',
    paddingVertical: S.lg,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.md,
    backgroundColor: C.canvas,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  restore: {
    alignItems: 'center',
    paddingTop: S.md,
  },
  later: {
    alignItems: 'center',
    paddingTop: S.sm,
    paddingBottom: S.xs,
  },
  alreadyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX,
  },
});
