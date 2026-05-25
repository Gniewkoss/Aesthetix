import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { PREMIUM_PLANS } from '../../constants';
import {
  formatSubscriptionDate,
  getPlanById,
  getStatusLabel,
  isSubscriptionActive,
  SubscriptionPlanId,
  TRIAL_DAYS,
} from '../../subscription/subscription';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageSubscription'>;

const STORE_SUBSCRIPTION_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

const PREMIUM_BENEFITS = [
  'Unlimited daily scans',
  'Full 11-muscle AI analysis',
  'AI Coach chat',
  'Progress charts & history',
  '2× XP on every scan',
];

export function ManageSubscriptionScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const subscribe = useSubscriptionStore((s) => s.subscribe);
  const changePlan = useSubscriptionStore((s) => s.changePlan);
  const cancelSubscription = useSubscriptionStore((s) => s.cancelSubscription);
  const reactivateAutoRenew = useSubscriptionStore((s) => s.reactivateAutoRenew);
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    subscription?.planId ?? 'monthly',
  );
  const [loading, setLoading] = useState(false);

  const isActive = isSubscriptionActive(subscription);
  const isPremium = user?.isPremium && isActive;
  const isCancelled = subscription?.status === 'cancelled' && isActive;
  const plan = subscription ? getPlanById(subscription.planId) : null;
  const statusLabel = getStatusLabel(subscription, !!user?.isPremium);

  const openStoreSubscriptions = () => {
    Linking.openURL(STORE_SUBSCRIPTION_URL).catch(() => {
      Alert.alert(
        'Store settings',
        Platform.OS === 'ios'
          ? 'Open Settings → Apple ID → Subscriptions to manage billing.'
          : 'Open Google Play → Payments & subscriptions to manage billing.',
      );
    });
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      Alert.alert(result.restored ? 'Restored' : 'Nothing to restore', result.message);
    } catch (err) {
      Alert.alert('Restore failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel subscription?',
      `You'll keep Premium access until ${subscription ? formatSubscriptionDate(subscription.currentPeriodEnd) : 'the end of your billing period'}. After that, you'll return to the free plan (1 scan/day).`,
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel subscription',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await cancelSubscription();
              Alert.alert(
                'Subscription cancelled',
                'Auto-renew is off. Premium features remain until your current period ends.',
              );
            } catch (err) {
              Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await reactivateAutoRenew();
      Alert.alert('Auto-renew enabled', 'Your subscription will renew at the end of the current period.');
    } catch (err) {
      Alert.alert('Could not reactivate', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!subscription || selectedPlan === subscription.planId) return;
    setLoading(true);
    try {
      await changePlan(selectedPlan);
      Alert.alert('Plan updated', `You're now on the ${getPlanById(selectedPlan).name} plan.`);
    } catch (err) {
      Alert.alert('Could not change plan', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      await subscribe(selectedPlan);
      Alert.alert(
        'Welcome to Premium',
        `Your ${TRIAL_DAYS}-day free trial has started. You won't be charged until the trial ends.`,
      );
    } catch (err) {
      Alert.alert('Purchase failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Manage Subscription" subtitle={statusLabel} onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Status card */}
          <Animated.View entering={FadeInDown.duration(350)}>
            <LinearGradient
              colors={isPremium ? ['#6D28D9', '#7C3AED'] : ['#1C1C1E', '#141414']}
              style={styles.statusCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statusIconWrap}>
                <Ionicons name={isPremium ? 'flash' : 'leaf-outline'} size={22} color="#fff" />
              </View>
              <Text style={styles.statusTitle}>
                {isPremium ? 'PhysiqueMax Premium' : 'Free Plan'}
              </Text>
              {isPremium && plan && (
                <>
                  <Text style={styles.statusPlan}>
                    {plan.name} · {plan.price}/{plan.period}
                  </Text>
                  {subscription?.trialEndsAt && subscription.status === 'trialing' && (
                    <Text style={styles.statusMeta}>
                      Trial ends {formatSubscriptionDate(subscription.trialEndsAt)}
                    </Text>
                  )}
                  <Text style={styles.statusMeta}>
                    {isCancelled ? 'Access until' : 'Renews'} {subscription && formatSubscriptionDate(subscription.currentPeriodEnd)}
                  </Text>
                  {subscription && (
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, isCancelled && styles.badgeWarning]}>
                        <Text style={styles.badgeText}>
                          {isCancelled ? 'Cancels at period end' : subscription.autoRenew ? 'Auto-renew on' : 'Auto-renew off'}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
              {!isPremium && (
                <Text style={styles.statusMeta}>1 scan per day · Upgrade for unlimited access</Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Benefits */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(50).duration(350)}>
              <GlassCard style={{ marginBottom: SPACING.base }}>
                <Text style={styles.sectionTitle}>Your benefits</Text>
                {PREMIUM_BENEFITS.map((b, i) => (
                  <View key={i} style={[styles.benefitRow, i < PREMIUM_BENEFITS.length - 1 && styles.rowBorder]}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Plan picker — subscribe or change */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <Text style={styles.plansLabel}>{isPremium ? 'CHANGE PLAN' : 'CHOOSE A PLAN'}</Text>
            {PREMIUM_PLANS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPlan(p.id as SubscriptionPlanId)}
                style={[styles.planCard, selectedPlan === p.id && styles.planCardSelected]}
                activeOpacity={0.82}
              >
                <View style={[styles.planRadio, selectedPlan === p.id && styles.planRadioActive]}>
                  {selectedPlan === p.id && <View style={styles.planRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Text style={styles.planSub}>{p.features.slice(0, 2).join(' · ')}</Text>
                </View>
                <Text style={styles.planPrice}>
                  {p.price}
                  <Text style={styles.planPeriod}>/{p.period}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Primary actions */}
          <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.actions}>
            {!isPremium ? (
              <>
                <GradientButton
                  title={loading ? 'Processing...' : 'Start free trial'}
                  onPress={handleSubscribe}
                  loading={loading}
                  variant="secondary"
                  size="lg"
                />
                <Text style={styles.legalText}>
                  {TRIAL_DAYS}-day free trial, then billed at the selected rate. Cancel anytime.
                </Text>
              </>
            ) : (
              <>
                {selectedPlan !== subscription?.planId && (
                  <GradientButton
                    title="Update plan"
                    onPress={handleChangePlan}
                    loading={loading}
                    variant="secondary"
                    size="md"
                    style={{ marginBottom: SPACING.md }}
                  />
                )}
                {isCancelled ? (
                  <GradientButton
                    title="Turn auto-renew back on"
                    onPress={handleReactivate}
                    loading={loading}
                    variant="secondary"
                    size="md"
                    style={{ marginBottom: SPACING.md }}
                  />
                ) : (
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} disabled={loading}>
                    <Text style={styles.cancelText}>Cancel subscription</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity onPress={handleRestore} style={styles.linkBtn} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Text style={styles.linkText}>Restore purchases</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={openStoreSubscriptions} style={styles.linkBtn}>
              <Ionicons name="open-outline" size={14} color={COLORS.accent} />
              <Text style={styles.linkText}>
                Manage in {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
              </Text>
            </TouchableOpacity>

            {!isPremium && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Premium')}
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>View full Premium details</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING['3xl'] },

  statusCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    alignItems: 'center',
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  statusTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    color: '#fff',
    letterSpacing: 0.3,
  },
  statusPlan: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  statusMeta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  badgeRow: { marginTop: SPACING.md },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeWarning: { backgroundColor: 'rgba(245,158,11,0.25)' },
  badgeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#fff',
    letterSpacing: 0.5,
  },

  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  plansLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: 1.8,
    marginBottom: SPACING.md,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  planCardSelected: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleDim,
  },
  planRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioActive: { borderColor: COLORS.purple },
  planRadioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.purple },
  planName: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  planSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  planPrice: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
  },
  planPeriod: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

  actions: { marginTop: SPACING.lg, alignItems: 'center' },
  legalText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: FONTS.sizes.xs * 1.6,
    paddingHorizontal: SPACING.md,
  },
  cancelBtn: { paddingVertical: SPACING.md },
  cancelText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.red,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
  },
  linkText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
  },
});
