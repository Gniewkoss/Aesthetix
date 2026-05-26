import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_PRESS } from '../../motion';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { SubscriptionPlanId } from '../../subscription/subscription';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { GradientButton } from '../../components/ui/GradientButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { SettingsSection } from '../../components/common/SettingsSection';
import { InfoRow } from '../../components/common/InfoRow';
import { COLORS, FONT_FAMILY, FONTS, GRADIENTS, LAYOUT, RADIUS, SPACING, TRACKING } from '../../theme';
import { PREMIUM_PLANS } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;
type FeatureIconName = keyof typeof Ionicons.glyphMap;

const FEATURES: { icon: FeatureIconName; title: string; sub: string }[] = [
  { icon: 'infinite-outline',       title: 'Unlimited Daily Scans',   sub: 'Scan as often as you need'                    },
  { icon: 'hardware-chip-outline',  title: 'Full AI Analysis',         sub: '11 muscle groups, issues, predictions'        },
  { icon: 'chatbubbles-outline',    title: 'AI Coach Chat',            sub: 'Ask your AI coach anything 24/7'              },
  { icon: 'stats-chart-outline',    title: 'Progress Tracking',        sub: 'Charts, history, and progress reports'        },
  { icon: 'flash-outline',          title: 'Priority XP',              sub: '2× XP on every scan'                         },
  { icon: 'share-outline',          title: 'Export Reports',           sub: 'Share your full AI physique report'           },
];

// Animated plan card with spring press effect
function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: (typeof PREMIUM_PLANS)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(0.975, SPRING_PRESS); };
  const handlePressOut = () => { scale.value = withSpring(1.0,   SPRING_PRESS); };

  return (
    <Animated.View style={cardStyle}>
      <TouchableOpacity
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
        ]}
      >
        {(plan as { popular?: boolean }).popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}
        <View style={styles.planRow}>
          <View style={[styles.planRadio, isSelected && styles.planRadioActive]}>
            {isSelected && <View style={styles.planRadioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planFeatures}>{plan.features.slice(0, 2).join(' · ')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.planPrice, isSelected && { color: COLORS.indigo }]}>
              {plan.price}
            </Text>
            <Text style={styles.planPeriod}>/{plan.period}</Text>
            {plan.savingsPercent && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>SAVE {plan.savingsPercent}%</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function PremiumScreen({ navigation, route }: Props) {
  const user      = useAuthStore((s) => s.user);
  const subscribe = useSubscriptionStore((s) => s.subscribe);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const pendingImageUris = route.params?.pendingImageUris;
  const willContinueScan = (pendingImageUris?.length ?? 0) > 0;

  const continueAfterPurchase = () => {
    if (willContinueScan && pendingImageUris) {
      navigation.replace('AnalysisLoading', { imageUris: pendingImageUris });
      return;
    }
    navigation.goBack();
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      await subscribe(selectedPlan as SubscriptionPlanId);
      setLoading(false);

      if (willContinueScan) {
        continueAfterPurchase();
        return;
      }

      Alert.alert('Welcome to Premium', 'You now have unlimited scans and full AI analysis.', [
        { text: "Let's go", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert(
        'Purchase failed',
        err instanceof Error ? err.message : 'Could not activate Premium. Please try again.',
      );
    }
  };

  if (user?.isPremium) {
    return (
      <View style={[styles.root, styles.rootCentered]}>
        <SafeAreaView style={{ alignItems: 'center', paddingHorizontal: SPACING.xl }}>
          <AesthetixLogo variant="mark" width={60} height={60} color={COLORS.cream} />
          <Text style={styles.alreadyTitle}>You're Premium</Text>
          <Text style={styles.alreadySub}>Enjoy unlimited scans and full AI analysis.</Text>
          <GradientButton
            title="Manage subscription"
            onPress={() => navigation.replace('ManageSubscription')}
            style={{ marginTop: SPACING['2xl'], width: 240 }}
            variant="secondary"
          />
          <GradientButton
            title={willContinueScan ? 'Continue scan' : 'Back'}
            onPress={continueAfterPurchase}
            style={{ marginTop: SPACING.md, width: 220 }}
            variant="outline"
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color={COLORS.text.secondary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Hero ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350)}>
            <LinearGradient
              colors={[...GRADIENTS.premium]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroIconWrap}>
                <AesthetixLogo variant="mark" width={36} height={36} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Aesthetix Premium</Text>
              <Text style={styles.heroSub}>
                {willContinueScan
                  ? 'Unlock unlimited scans — your photos will be analyzed immediately after purchase.'
                  : 'Unlock your full physique potential with unlimited AI-powered analysis.'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {willContinueScan && (
            <Animated.View entering={FadeInDown.delay(40).duration(350)}>
              <GlassCard style={styles.pendingBanner}>
                <InfoRow
                  title={`${pendingImageUris!.length} photo${pendingImageUris!.length > 1 ? 's' : ''} ready`}
                  subtitle="Scan continues automatically after checkout"
                  leftContent={<Ionicons name="images-outline" size={16} color={COLORS.indigo} />}
                  grouped={false}
                />
              </GlassCard>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <SettingsSection label="What's included" noTopMargin={!willContinueScan}>
              {FEATURES.map((f, i) => (
                <InfoRow
                  key={f.title}
                  title={f.title}
                  subtitle={f.sub}
                  showBorder={i < FEATURES.length - 1}
                  leftContent={
                    <View style={styles.featureIconWrap}>
                      <Ionicons name={f.icon} size={15} color={COLORS.indigo} />
                    </View>
                  }
                  rightContent={<Ionicons name="checkmark-circle" size={18} color={COLORS.green} />}
                />
              ))}
            </SettingsSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(350)}>
            <SettingsSection label="Choose a plan">
              {PREMIUM_PLANS.map((plan, i) => (
                <View
                  key={plan.id}
                  style={i < PREMIUM_PLANS.length - 1 ? styles.planRowBorder : undefined}
                >
                  <PlanCard
                    plan={plan}
                    isSelected={selectedPlan === plan.id}
                    onSelect={() => setSelectedPlan(plan.id)}
                  />
                </View>
              ))}
            </SettingsSection>
          </Animated.View>

          {/* ── CTA ─────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(350)}
            style={styles.ctaArea}
          >
            <GradientButton
              title={
                loading
                  ? 'Processing...'
                  : willContinueScan
                    ? 'Unlock & continue scan'
                    : 'Start Premium'
              }
              onPress={handleSubscribe}
              loading={loading}
              variant="brand"
              size="lg"
              style={{ width: '100%' }}
            />
            <View style={styles.trialRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.green} />
              <Text style={styles.trialText}>3-day free trial · Cancel anytime</Text>
            </View>
            <Text style={styles.legalText}>
              Subscription renews automatically. Cancel anytime in Manage Subscription.
            </Text>
          </Animated.View>

          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  rootCentered: { alignItems: 'center', justifyContent: 'center' },

  closeBtn: {
    position: 'absolute',
    right: LAYOUT.pagePad,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingTop: SPACING['2xl'] },

  heroGradient: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: '#fff',
    letterSpacing: TRACKING.display,
    marginBottom: SPACING.sm,
  },
  heroSub: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: FONTS.sizes.sm * 1.6,
  },

  pendingBanner: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderColor: COLORS.indigoBorder,
    backgroundColor: COLORS.indigoDim,
  },

  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.indigoDim,
    borderWidth: 1,
    borderColor: COLORS.indigoBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  planCard: {
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    marginBottom: 0,
  },
  planCardSelected: {
    backgroundColor: COLORS.indigoDim,
  },
  planRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.hairline,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.indigo,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginBottom: SPACING.sm,
  },
  popularText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#fff',
    letterSpacing: 0.8,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  planRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioActive: { borderColor: COLORS.indigo },
  planRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.indigo,
  },
  planName: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  planFeatures: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 1,
  },
  planPrice: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
  },
  planPeriod: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  savingsBadge: {
    backgroundColor: COLORS.greenDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginTop: 4,
  },
  savingsText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.green,
    letterSpacing: 0.5,
  },

  // ── CTA
  ctaArea: { marginTop: SPACING.base, alignItems: 'center' },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.base,
  },
  trialText: {
    color: COLORS.green,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  legalText: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: FONTS.sizes.xs * 1.7,
  },

  alreadyTitle: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: TRACKING.display,
    marginTop: SPACING.xl,
  },
  alreadySub: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: FONTS.sizes.base * 1.5,
  },
});
