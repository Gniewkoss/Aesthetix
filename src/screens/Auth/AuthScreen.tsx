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
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Separator } from '../../components/ui/Separator';
import { APP_BRAND } from '../../constants/brand';
import { useAuthStore } from '../../store/useAuthStore';
import {
  COLORS, FONT_FAMILY, FONTS, GRADIENTS, RADIUS, SPACING, TRACKING,
} from '../../theme';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// ── Mode toggle — shadcn Tabs-style segmented control ─────────────────────────
function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'login' | 'register';
  onChange: (m: 'login' | 'register') => void;
}) {
  return (
    <View style={toggle.track}>
      {(['login', 'register'] as const).map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => onChange(m)}
          style={[toggle.tab, mode === m && toggle.tabActive]}
          activeOpacity={0.85}
        >
          <Text style={[toggle.tabText, mode === m && toggle.tabTextActive]}>
            {m === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const toggle = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    padding: 3,
    marginBottom: SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.bg.elevated,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.muted,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: COLORS.text.primary,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export function AuthScreen({ navigation: _navigation }: Props) {
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
      {/* Ambient diagonal cream sweep */}
      <LinearGradient
        colors={GRADIENTS.diagonalCream}
        start={{ x: 0.0, y: 1.0 }}
        end={{ x: 0.8, y: 0.1 }}
        style={styles.bgGlow}
        pointerEvents="none"
      />
      {/* Top-right accent sweep */}
      <LinearGradient
        colors={GRADIENTS.diagonalBlue}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.3, y: 0.8 }}
        style={styles.bgGlowTopRight}
        pointerEvents="none"
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
            {/* ── Brand identity ── */}
            <Animated.View entering={FadeInDown.duration(480)} style={styles.brand}>
              <View style={styles.logoMark}>
                <AesthetixLogo variant="mark" width={40} height={40} color={COLORS.cream} />
              </View>
              <Text style={styles.brandName}>AESTHETIX AI</Text>
              <Text style={styles.brandTagline}>{APP_BRAND.tagline}</Text>
            </Animated.View>

            {/* ── Auth card ── */}
            <Animated.View entering={FadeInDown.delay(120).duration(480)} style={styles.card}>
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
                  <Separator label="or continue with" style={styles.divider} />

                  {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                      cornerRadius={RADIUS.xl}
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
                Continue with Demo Account
              </Button>
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(300).duration(400)} style={styles.legal}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </Animated.Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  bgGlow: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 340,
    height: 520,
  },
  bgGlowTopRight: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 300,
    height: 400,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING['3xl'],
  },

  // ── Brand
  brand: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
    gap: SPACING.xs,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.creamDim,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  brandName: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.cream,
    letterSpacing: TRACKING.caps,
  },
  brandTagline: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── Card
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border.default,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },

  submitBtn: {
    marginTop: SPACING.xs,
  },
  divider: {
    marginVertical: SPACING.base,
  },
  appleBtn: {
    width: '100%',
    height: 50,
    marginBottom: SPACING.sm,
  },
  demoBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'center',
  },

  // ── Legal
  legal: {
    textAlign: 'center',
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.xs * 1.7,
    paddingHorizontal: SPACING.lg,
  },
});
