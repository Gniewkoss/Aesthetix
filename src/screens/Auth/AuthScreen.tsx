import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { RootStackParamList } from '../../navigation/types';
import { AppleSignInButton } from '../../components/auth/AppleSignInButton';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { isGoogleAuthEnabled } from '../../auth/googleAuth';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';
import { APP_BRAND } from '../../constants/brand';
import { useAuthStore } from '../../store/useAuthStore';
import { useConsentStore } from '../../store/useConsentStore';
import { validateEmail, validatePassword, validateName } from '../../lib/validation';
import { trackEvent } from '../../lib/analytics';
import { PRIVACY_URL, TERMS_URL } from '../../constants/legal';
import { C, T, R, S, LAYOUT, E } from '../../theme/obsidian';
import { ObsInput } from '../../components/obsidian/ObsInput';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { SegmentedControl } from '../Progress/progress/SegmentedControl';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const SEGMENTS = [
  { key: 'login', label: 'Sign In' },
  { key: 'register', label: 'Create Account' },
];

function consentHaptic() {
  void Haptics.selectionAsync();
}

function ConsentCheckbox({ checked, onToggle, children, error }: {
  checked: boolean; onToggle: () => void; children: React.ReactNode; error?: boolean;
}) {
  const handleToggle = () => {
    consentHaptic();
    onToggle();
  };

  return (
    <Pressable style={styles.consentRow} onPress={handleToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxChecked, error && styles.boxError]}>
        {checked && <Ionicons name="checkmark" size={13} color={C.voltInk} />}
      </View>
      <Text style={[T.caption, styles.consentLabel]}>{children}</Text>
    </Pressable>
  );
}

export function AuthScreen({ navigation: _navigation }: Props) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const { login, register, isLoading } = useAuthStore();
  const recordAcceptance = useConsentStore((s) => s.recordAcceptance);
  const showGoogleSignIn = isGoogleAuthEnabled();

  const openLink = (url: string) => { void Linking.openURL(url).catch(() => {}); };
  const openLegalLink = (url: string, e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    consentHaptic();
    openLink(url);
  };

  const handleSubmit = async () => {
    const errors: typeof fieldErrors = {};
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) errors.email = emailCheck.error;

    if (mode === 'register') {
      const nameCheck = validateName(name);
      if (!nameCheck.valid) errors.name = nameCheck.error;
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) errors.password = passwordCheck.error;
    } else if (!password) {
      errors.password = 'Password is required';
    }

    const needsConsent = mode === 'register' && !agreeTerms;
    setConsentError(needsConsent);

    if (Object.keys(errors).length > 0 || needsConsent) { setFieldErrors(errors); return; }
    setFieldErrors({});

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await recordAcceptance(analyticsOptIn);
        await register(name, email, password);
        trackEvent('signup_completed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg === 'CONFIRM_EMAIL') {
        Alert.alert('Check your email', 'We sent a confirmation link. Please verify your email and sign in.');
      } else if (msg === 'EMAIL_RATE_LIMIT') {
        Alert.alert('Email limit reached', 'Wait about an hour, or turn off "Confirm email" in Supabase → Authentication → Providers → Email.');
      } else if (msg === 'AUTH_RATE_LIMIT') {
        Alert.alert('Too many attempts', 'Please wait a few minutes and try again.');
      } else if (msg === 'EMAIL_ALREADY_REGISTERED') {
        setFieldErrors({ email: 'Email already in use' });
      } else if (msg === 'SIGNUP_DISABLED') {
        Alert.alert('Sign up disabled', 'Enable email signups in Supabase → Authentication → Providers → Email.');
      } else {
        if (__DEV__) console.warn('[auth] unhandled error:', msg);
        Alert.alert('Error', msg);
      }
    }
  };

  const showSocial = Platform.OS === 'ios' || showGoogleSignIn;

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Brand */}
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(420)} style={styles.brand}>
              <AesthetixLogo variant="wordmark" width={224} />
              <Text style={styles.brandTagline}>{APP_BRAND.tagline}</Text>
            </Animated.View>

            {/* Card */}
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(420)} style={styles.card}>
              <SegmentedControl options={SEGMENTS} value={mode} onChange={(k) => setMode(k as 'login' | 'register')} reduceMotion={reduceMotion} />

              <View style={{ height: S.lg }} />

              {mode === 'register' && (
                <ObsInput
                  label="Full Name"
                  leftIcon="person-outline"
                  value={name}
                  onChangeText={(v) => { setName(v); setFieldErrors((e) => ({ ...e, name: undefined })); }}
                  placeholder="Your name"
                  autoCapitalize="words"
                  error={fieldErrors.name}
                />
              )}

              <ObsInput
                label="Email"
                leftIcon="mail-outline"
                value={email}
                onChangeText={(v) => { setEmail(v); setFieldErrors((e) => ({ ...e, email: undefined })); }}
                placeholder="example@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={fieldErrors.email}
              />

              <ObsInput
                label="Password"
                leftIcon="lock-closed-outline"
                value={password}
                onChangeText={(v) => { setPassword(v); setFieldErrors((e) => ({ ...e, password: undefined })); }}
                placeholder="••••••••"
                isPassword
                hint={mode === 'register' ? 'Minimum 8 characters' : undefined}
                error={fieldErrors.password}
              />

              {mode === 'register' && (
                <View style={styles.consentBlock}>
                  <ConsentCheckbox checked={agreeTerms} onToggle={() => { setAgreeTerms((v) => !v); setConsentError(false); }} error={consentError}>
                    I agree to the <Text style={styles.link} onPress={(e) => openLegalLink(TERMS_URL, e)}>Terms of Service</Text> and <Text style={styles.link} onPress={(e) => openLegalLink(PRIVACY_URL, e)}>Privacy Policy</Text>.
                  </ConsentCheckbox>
                  <ConsentCheckbox checked={analyticsOptIn} onToggle={() => setAnalyticsOptIn((v) => !v)}>
                    Share anonymous usage analytics to help improve the app (optional).
                  </ConsentCheckbox>
                  {consentError && <Text style={[T.caption, { color: C.danger, marginTop: 2 }]}>Please accept the Terms and Privacy Policy to continue.</Text>}
                </View>
              )}

              <ObsButton
                title={mode === 'login' ? 'Sign In' : 'Create Account'}
                onPress={handleSubmit}
                loading={isLoading}
                glow
                style={{ marginTop: S.sm, height: 54 }}
              />

              {showSocial && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={[T.caption, { color: C.text3 }]}>or continue with</Text>
                    <View style={styles.line} />
                  </View>
                  {Platform.OS === 'ios' && <AppleSignInButton disabled={isLoading} />}
                  {showGoogleSignIn && <GoogleSignInButton disabled={isLoading} />}
                </>
              )}

            </Animated.View>

            {mode === 'register' && <MedicalDisclaimer style={styles.disclaimer} compact />}

            {mode === 'login' && (
              <Animated.Text entering={reduceMotion ? undefined : FadeInUp.delay(280).duration(400)} style={[T.caption, styles.legal]}>
                By continuing you agree to our <Text style={styles.link} onPress={(e) => openLegalLink(TERMS_URL, e)}>Terms of Service</Text> and <Text style={styles.link} onPress={(e) => openLegalLink(PRIVACY_URL, e)}>Privacy Policy</Text>.
              </Animated.Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { flexGrow: 1, paddingHorizontal: LAYOUT.screenX, paddingTop: S['4xl'], paddingBottom: S['3xl'] },

  brand: { alignItems: 'center', marginBottom: S['2xl'], gap: S.sm },
  brandTagline: {
    ...T.caption,
    color: C.text3,
    textAlign: 'center',
  },

  card: { ...E.card, borderRadius: R.xl, padding: LAYOUT.cardPad, marginBottom: S.lg },

  consentBlock: { marginTop: S.sm, marginBottom: S.xs, gap: S.sm },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  box: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderMd,
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  boxChecked: { backgroundColor: C.volt, borderColor: C.volt },
  boxError: { borderColor: C.danger },
  consentLabel: { flex: 1, color: C.text3, lineHeight: 18 },
  link: { color: C.volt, fontFamily: 'Manrope_600SemiBold' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginVertical: S.base },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.border },

  disclaimer: { marginBottom: S.lg },
  legal: { textAlign: 'center', color: C.text3, lineHeight: 18, paddingHorizontal: S.lg },
});
