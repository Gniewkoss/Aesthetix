import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { mapAuthError } from '../../auth/authErrors';
import { isGoogleAuthEnabled } from '../../auth/googleAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { REDESIGN } from '../../theme/redesign-new';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const { COLORS, FONTS, SPACING, RADIUS, SHADOWS, GRADIENTS } = REDESIGN;

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'login' | 'register';
  onChange: (m: 'login' | 'register') => void;
}) {
  return (
    <View style={styles.toggle}>
      {(['login', 'register'] as const).map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => onChange(m)}
          style={[styles.toggleTab, mode === m && styles.toggleTabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
            {m === 'login' ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function AuthScreenRedesign({ navigation: _navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const { login, register, loginWithApple, isLoading } = useAuthStore();
  const showGoogleSignIn = isGoogleAuthEnabled();

  const handleSubmit = async () => {
    const errors: typeof fieldErrors = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (mode === 'register' && !name) errors.name = 'Name is required';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
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

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        Alert.alert('Error', 'Apple Sign In failed — no token received.');
        return;
      }
      const fullName = credential.fullName?.givenName
        ? `${credential.fullName.givenName}${credential.fullName.familyName ? ' ' + credential.fullName.familyName : ''}`
        : null;
      await loginWithApple(credential.identityToken, fullName);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      const msg = err instanceof Error ? mapAuthError(err.message) : 'Apple Sign In failed';
      if (msg !== 'APPLE_PROVIDER_DISABLED') Alert.alert('Error', msg);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={GRADIENTS.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
              <View style={styles.logoBox}>
                <LinearGradient
                  colors={GRADIENTS.heroOrange}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Ionicons name="flash" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>PhysiqueMax</Text>
              <Text style={styles.subtitle}>
                {mode === 'login' ? 'Welcome back' : 'Join the fitness revolution'}
              </Text>
            </Animated.View>

            {/* Card */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.card}
            >
              <ModeToggle mode={mode} onChange={setMode} />

              {mode === 'register' && (
                <Input
                  label="Full Name"
                  leftIcon={<Ionicons name="person-outline" size={16} color={COLORS.text.muted} />}
                  value={name}
                  onChangeText={(v) => { setName(v); setFieldErrors((e) => ({ ...e, name: undefined })); }}
                  placeholder="Your name"
                  autoCapitalize="words"
                  error={fieldErrors.name}
                />
              )}

              <Input
                label="Email"
                leftIcon={<Ionicons name="mail-outline" size={16} color={COLORS.text.muted} />}
                value={email}
                onChangeText={(v) => { setEmail(v); setFieldErrors((e) => ({ ...e, email: undefined })); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={fieldErrors.email}
              />

              <Input
                label="Password"
                leftIcon={<Ionicons name="lock-closed-outline" size={16} color={COLORS.text.muted} />}
                value={password}
                onChangeText={(v) => { setPassword(v); setFieldErrors((e) => ({ ...e, password: undefined })); }}
                placeholder="••••••••"
                isPassword
                hint={mode === 'register' ? 'Minimum 8 characters' : undefined}
                error={fieldErrors.password}
              />

              <Button
                variant="default"
                size="lg"
                onPress={handleSubmit}
                loading={isLoading}
                style={styles.submitBtn}
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>

              {/* Social login */}
              {(Platform.OS === 'ios' || showGoogleSignIn) && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                      cornerRadius={RADIUS.lg}
                      style={styles.appleBtn}
                      onPress={handleAppleSignIn}
                    />
                  )}

                  {showGoogleSignIn && <GoogleSignInButton disabled={isLoading} />}
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onPress={() => login('demo@physiquemax.ai', 'demo')}
                style={styles.demoBtn}
              >
                <Ionicons name="play" size={14} color={COLORS.primary} />
                <Text style={{ marginLeft: 8, color: COLORS.primary }}>Demo Account</Text>
              </Button>
            </Animated.View>

            <Animated.Text
              entering={FadeInUp.delay(200).duration(400)}
              style={styles.legal}
            >
              By continuing you agree to our Terms of Service and Privacy Policy.
            </Animated.Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
    marginTop: SPACING.lg,
  },

  logoBox: {
    marginBottom: SPACING.lg,
  },

  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },

  title: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
  },

  // Card
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
    gap: SPACING.base,
  },

  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
    gap: 4,
  },

  toggleTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },

  toggleTabActive: {
    backgroundColor: COLORS.primary,
  },

  toggleText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.family.body,
    color: COLORS.text.muted,
    fontWeight: '600',
  },

  toggleTextActive: {
    color: '#FFFFFF',
  },

  submitBtn: {
    marginTop: SPACING.md,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  dividerText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.family.body,
  },

  appleBtn: {
    width: '100%',
    height: SPACING['3xl'],
    marginBottom: SPACING.sm,
  },

  demoBtn: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  legal: {
    textAlign: 'center',
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.family.body,
    lineHeight: FONTS.sizes.xs * 1.6,
    paddingHorizontal: SPACING.lg,
  },
});
