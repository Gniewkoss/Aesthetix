import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';
import { PREMIUM_PLANS } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;
type FeatureIconName = keyof typeof Ionicons.glyphMap;

const FEATURES: { icon: FeatureIconName; title: string; sub: string }[] = [
  { icon: 'infinite-outline', title: 'Unlimited Daily Scans', sub: 'Scan as often as you need' },
  { icon: 'hardware-chip-outline', title: 'Full AI Analysis', sub: '11 muscle groups, issues, predictions' },
  { icon: 'chatbubbles-outline', title: 'AI Coach Chat', sub: 'Ask your AI coach anything 24/7' },
  { icon: 'stats-chart-outline', title: 'Progress Tracking', sub: 'Charts, history, and progress reports' },
  { icon: 'flash-outline', title: 'Priority XP', sub: '2× XP on every scan' },
  { icon: 'share-outline', title: 'Export Reports', sub: 'Share your full AI physique report' },
];

export function PremiumScreen({ navigation, route }: Props) {
  const { upgradeToPremium, user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);

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
    await new Promise((r) => setTimeout(r, 1500));
    upgradeToPremium();
    setLoading(false);

    if (willContinueScan) {
      continueAfterPurchase();
      return;
    }

    Alert.alert('Welcome to Premium', 'You now have unlimited scans and full AI analysis.', [
      { text: "Let's go", onPress: () => navigation.goBack() },
    ]);
  };

  if (user?.isPremium) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl }]}>
        <SafeAreaView style={{ alignItems: 'center' }}>
          <View style={styles.premiumActiveIcon}>
            <Ionicons name="flash" size={32} color={COLORS.purple} />
          </View>
          <Text style={styles.alreadyTitle}>You're Premium</Text>
          <Text style={styles.alreadySub}>Enjoy unlimited scans and full AI analysis.</Text>
          <GradientButton
            title={willContinueScan ? 'Continue scan' : 'Back'}
            onPress={continueAfterPurchase}
            style={{ marginTop: SPACING['2xl'], width: 220 }}
            variant="secondary"
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={18} color={COLORS.text.secondary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="flash" size={32} color={COLORS.purple} />
            </View>
            <Text style={styles.heroTitle}>PhysiqueMax{'\n'}Premium</Text>
            <Text style={styles.heroSub}>
              {willContinueScan
                ? 'Unlock unlimited scans — your photos will be analyzed immediately after purchase.'
                : 'Unlock your full physique potential with unlimited AI-powered analysis.'}
            </Text>
          </Animated.View>

          {willContinueScan && (
            <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.pendingBanner}>
              <Ionicons name="images-outline" size={16} color={COLORS.purple} />
              <Text style={styles.pendingBannerText}>
                {pendingImageUris!.length} photo{pendingImageUris!.length > 1 ? 's' : ''} ready — scan continues after checkout
              </Text>
            </Animated.View>
          )}

          {/* Feature list */}
          <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={16} color={COLORS.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark" size={16} color={COLORS.green} />
              </View>
            ))}
          </Animated.View>

          {/* Plans */}
          <Animated.View entering={FadeInDown.delay(160).duration(350)}>
            <Text style={styles.plansLabel}>CHOOSE A PLAN</Text>
            {PREMIUM_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.82}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                ]}
              >
                {(plan as { popular?: boolean }).popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.planRow}>
                  <View style={[styles.planRadio, selectedPlan === plan.id && styles.planRadioActive]}>
                    {selectedPlan === plan.id && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planFeatures}>{plan.features.slice(0, 2).join(' · ')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                    {plan.savingsPercent && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>SAVE {plan.savingsPercent}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.ctaArea}>
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
              variant="secondary"
              size="lg"
            />
            <View style={styles.trialRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.green} />
              <Text style={styles.trialText}>3-day free trial · Cancel anytime</Text>
            </View>
            <Text style={styles.legalText}>
              Subscription renews automatically. Cancel anytime in Settings.
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

  closeBtn: {
    position: 'absolute',
    top: 52,
    right: SPACING.base,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING['2xl'] },

  hero: { alignItems: 'center', marginBottom: SPACING.lg, paddingTop: SPACING.base },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.purpleDim,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: FONTS.sizes['3xl'] * 1.05,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: FONTS.sizes.base * 1.6,
  },

  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.purpleDim,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  pendingBannerText: {
    flex: 1,
    color: COLORS.purple,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    lineHeight: FONTS.sizes.xs * 1.5,
  },

  featureList: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 13,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.purpleDim,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  featureSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 1,
  },

  plansLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: 1.8,
    marginBottom: SPACING.md,
  },
  planCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.bg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  planCardSelected: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleDim,
  },
  popularBadge: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  popularText: {
    fontSize: 9,
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
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.green,
    letterSpacing: 0.5,
  },

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

  premiumActiveIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.purpleDim,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  alreadyTitle: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
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
