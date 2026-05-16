import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { GradientButton } from '../../components/ui/GradientButton';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import { PREMIUM_PLANS } from '../../constants';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  { icon: '🔓', title: 'Unlimited Daily Scans', sub: 'Scan as many times as you want' },
  { icon: '🤖', title: 'Full AI Analysis', sub: '11 muscle groups, issues, glow-up prediction' },
  { icon: '💬', title: 'AI Coach Chat', sub: 'Ask your AI coach anything 24/7' },
  { icon: '📊', title: 'Progress Tracking', sub: 'Charts, history, and progress reports' },
  { icon: '🏆', title: 'Priority XP', sub: '2x XP on every scan' },
  { icon: '📤', title: 'Export Reports', sub: 'Share your full AI physique report as PDF' },
];

export function PremiumScreen() {
  const navigation = useNavigation<Nav>();
  const { upgradeToPremium, user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    upgradeToPremium();
    setLoading(false);
    Alert.alert('Welcome to Premium! ⚡', 'You now have unlimited scans and full AI analysis.', [
      { text: 'Let\'s go!', onPress: () => navigation.goBack() },
    ]);
  };

  if (user?.isPremium) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl }]}>
        <SafeAreaView>
          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: SPACING.xl }}>⚡</Text>
          <Text style={styles.alreadyTitle}>You're Premium!</Text>
          <Text style={styles.alreadySub}>Enjoy unlimited scans and full AI analysis.</Text>
          <GradientButton title="Back" onPress={() => navigation.goBack()} style={{ marginTop: SPACING['2xl'] }} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(255,0,110,0.2)', 'rgba(123,47,190,0.15)', 'transparent']}
        style={styles.heroBg}
        locations={[0, 0.5, 1]}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={COLORS.text.secondary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <LinearGradient
              colors={['#FF006E', '#7B2FBE', '#00F5FF']}
              style={styles.heroIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroEmoji}>⚡</Text>
            </LinearGradient>
            <Text style={styles.heroTitle}>PhysiqueMax{'\n'}Premium</Text>
            <Text style={styles.heroSub}>
              Unlock your full physique potential with unlimited AI analysis
            </Text>
          </Animated.View>

          {/* Feature list */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
              </View>
            ))}
          </Animated.View>

          {/* Plans */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.plansLabel}>CHOOSE YOUR PLAN</Text>
            {PREMIUM_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    selectedPlan === plan.id
                      ? ['rgba(123,47,190,0.3)', 'rgba(0,245,255,0.15)']
                      : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                  }
                  style={[
                    styles.planCard,
                    selectedPlan === plan.id && styles.planCardSelected,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {(plan as any).popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  <View style={styles.planRow}>
                    <View style={styles.planRadio}>
                      {selectedPlan === plan.id && (
                        <View style={styles.planRadioInner} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planFeatures}>{plan.features.slice(0, 2).join(' • ')}</Text>
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
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Subscribe CTA */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.ctaArea}>
            <GradientButton
              title={loading ? 'Processing...' : 'Start Premium →'}
              onPress={handleSubscribe}
              loading={loading}
              variant="secondary"
              size="lg"
            />
            <Text style={styles.trialText}>✓ 3-day free trial • Cancel anytime</Text>
            <Text style={styles.legalText}>
              Subscription renews automatically. Cancel anytime in Settings.{'\n'}
              By subscribing you agree to our Terms of Service.
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
  heroBg: { position: 'absolute', width: '100%', height: 500, top: 0 },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: SPACING.base,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING['2xl'] },
  hero: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  heroIcon: {
    width: 90, height: 90, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  heroEmoji: { fontSize: 44 },
  heroTitle: {
    fontSize: FONTS.sizes['3xl'], fontWeight: FONTS.weights.black,
    color: COLORS.text.primary, textAlign: 'center',
    lineHeight: FONTS.sizes['3xl'] * 1.1, marginBottom: SPACING.md,
  },
  heroSub: { fontSize: FONTS.sizes.base, color: COLORS.text.secondary, textAlign: 'center', lineHeight: FONTS.sizes.base * 1.5 },
  featureList: {
    backgroundColor: COLORS.glass.bg, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.glass.border,
    padding: SPACING.base, marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  featureIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  featureTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text.primary },
  featureSub: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, marginTop: 1 },
  plansLabel: {
    fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.text.muted,
    letterSpacing: 2, marginBottom: SPACING.md,
  },
  planCard: {
    borderRadius: RADIUS.xl, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    padding: SPACING.base, marginBottom: SPACING.md, overflow: 'visible',
  },
  planCardSelected: { borderColor: COLORS.cyan },
  popularBadge: {
    backgroundColor: COLORS.cyan, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 2,
    alignSelf: 'flex-start', marginBottom: SPACING.sm,
  },
  popularText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.black, color: '#000' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  planRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.cyan,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.cyan },
  planName: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text.primary },
  planFeatures: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, marginTop: 2 },
  planPrice: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  planPeriod: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted },
  savingsBadge: {
    backgroundColor: COLORS.greenDim, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.greenBorder, marginTop: 4,
  },
  savingsText: { fontSize: 9, fontWeight: FONTS.weights.black, color: COLORS.green },
  ctaArea: { marginTop: SPACING.base, alignItems: 'center' },
  trialText: { color: COLORS.green, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, marginTop: SPACING.base },
  legalText: {
    color: COLORS.text.disabled, fontSize: FONTS.sizes.xs, textAlign: 'center',
    marginTop: SPACING.md, lineHeight: FONTS.sizes.xs * 1.6,
  },
  alreadyTitle: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black, color: COLORS.text.primary, textAlign: 'center' },
  alreadySub: { fontSize: FONTS.sizes.base, color: COLORS.text.secondary, textAlign: 'center', marginTop: SPACING.md },
});
