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
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { RootStackParamList } from '../../navigation/types';
import { PREMIUM_PLANS } from '../../constants';
import { C, T, R, S, LAYOUT, E } from '../../theme/obsidian';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { ObsCloseButton, OBS_CLOSE_SIZE } from '../../components/obsidian/ObsCloseButton';
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
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: S.base + 4, paddingBottom: insets.bottom + 168 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBand}>
            <ObsCloseButton onPress={() => navigation.goBack()} style={styles.topClose} />
            <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Svg width={200} height={200} style={styles.heroGlowSvg} pointerEvents="none">
                <Defs>
                  <RadialGradient id="paywallIconMist" cx="50%" cy="50%" r="55%">
                    <Stop offset="0" stopColor={C.volt} stopOpacity={0.16} />
                    <Stop offset="0.25" stopColor={C.volt} stopOpacity={0.09} />
                    <Stop offset="0.5" stopColor={C.volt} stopOpacity={0.05} />
                    <Stop offset="0.75" stopColor={C.volt} stopOpacity={0.02} />
                    <Stop offset="1" stopColor={C.volt} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#paywallIconMist)" />
              </Svg>
              <View style={styles.heroMark}>
                <AesthetixLogo variant="mark" width={48} />
              </View>
            </View>
            <Text style={[T.h1, styles.headline, { color: C.text }]}>{copy.headline}</Text>
            <Text style={[T.body, styles.subheadline, { color: C.text2 }]}>
              {copy.subheadline}
            </Text>
            </Animated.View>
          </View>

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

          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.plansSection}>
            <Text style={[T.overline, styles.plansLabel, { color: C.text3 }]}>CHOOSE YOUR PLAN</Text>
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
            style={{ height: 52 }}
          />
          <Text style={[T.caption, { color: C.text3, textAlign: 'center', marginTop: S.sm }]}>
            {selectedMeta.price}/{selectedMeta.period === 'week' ? 'week' : 'month'} · App Store / Play billing
          </Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={handleRestore} disabled={loading} hitSlop={8}>
              <Text style={[T.caption, { color: C.text3 }]}>Restore purchases</Text>
            </Pressable>
            <Text style={[T.caption, { color: C.borderMd }]}>·</Text>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={[T.caption, { color: C.text2 }]}>Maybe later</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: LAYOUT.screenX,
  },
  topBand: {
    position: 'relative',
    marginBottom: S.xl,
  },
  topClose: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  hero: {
    alignItems: 'center',
    gap: S.xs,
    paddingTop: OBS_CLOSE_SIZE,
  },
  heroIconWrap: {
    width: 128,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlowSvg: {
    position: 'absolute',
    top: -40,
    left: -40,
  },
  heroMark: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: C.borderMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
    paddingHorizontal: S.sm,
  },
  subheadline: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: S.lg,
    maxWidth: 340,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: S['2xl'],
    paddingHorizontal: S.xs,
    gap: S.sm,
  },
  trustItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  plansSection: {
    marginTop: S.xs,
  },
  plansLabel: {
    marginBottom: S.lg,
    letterSpacing: 1,
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
    marginTop: S.lg,
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
    paddingTop: S.xl,
    paddingBottom: S.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.lg,
    backgroundColor: C.canvas,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    marginTop: S.md,
    paddingBottom: S.xs,
  },
  alreadyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX,
  },
});
