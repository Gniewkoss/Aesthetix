import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
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
import { GradientButton } from '../../components/ui/GradientButton';
import { APP_BRAND } from '../../constants/brand';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// ── Animated input with smooth focus glow ─────────────────────────────────────
type AnimatedInputProps = TextInputProps & {
  label: string;
  leftIcon: React.ReactNode;
};

function AnimatedInput({ label, leftIcon, ...inputProps }: AnimatedInputProps) {
  const focus = useSharedValue(0);

  const wrapStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      ['rgba(255,255,255,0.09)', 'rgba(59,130,246,0.52)'],
    ),
    backgroundColor: interpolateColor(
      focus.value,
      [0, 1],
      ['rgba(255,255,255,0.04)', 'rgba(59,130,246,0.07)'],
    ),
  }));

  return (
    <View style={inpStyles.field}>
      <Text style={inpStyles.label}>{label}</Text>
      <Animated.View style={[inpStyles.wrap, wrapStyle]}>
        <View style={inpStyles.iconWrap}>{leftIcon}</View>
        <TextInput
          style={inpStyles.input}
          placeholderTextColor={COLORS.text.disabled}
          onFocus={() => { focus.value = withTiming(1, { duration: 180 }); }}
          onBlur={()  => { focus.value = withTiming(0, { duration: 220 }); }}
          {...inputProps}
        />
      </Animated.View>
    </View>
  );
}

const inpStyles = StyleSheet.create({
  field: { marginBottom: SPACING.base },
  label: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.secondary,
    marginBottom: 7,
    letterSpacing: 0.4,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  iconWrap: { opacity: 0.45 },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.body,
    height: '100%',
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export function AuthScreen({ navigation: _navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loginWithApple, isLoading } = useAuthStore();
  const showGoogleSignIn = isGoogleAuthEnabled();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (mode === 'register' && !name) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }
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
        Alert.alert(
          'Email limit reached',
          'Supabase allows only a few auth emails per hour on the free plan. Wait about an hour, or turn off "Confirm email" in Supabase → Authentication → Providers → Email while developing.',
        );
      } else if (msg === 'AUTH_RATE_LIMIT') {
        Alert.alert('Too many attempts', 'Please wait a few minutes and try again.');
      } else if (msg === 'EMAIL_ALREADY_REGISTERED') {
        Alert.alert(
          'Email already in use',
          'This email is already registered. Try Sign In, use a different email, or delete the user in Supabase → Authentication → Users (deleting users does not reset the email send limit).',
        );
      } else if (msg === 'REDIRECT_URL_NOT_ALLOWED') {
        Alert.alert(
          'Redirect URL not configured',
          'Add the Expo redirect URL to Supabase → Authentication → URL Configuration → Redirect URLs (see Metro log: [Aesthetix] Add to Supabase…).',
        );
      } else if (msg === 'SIGNUP_DISABLED') {
        Alert.alert('Sign up disabled', 'Enable email signups in Supabase → Authentication → Providers → Email.');
      } else if (msg === 'APPLE_PROVIDER_DISABLED' || msg === 'GOOGLE_PROVIDER_DISABLED') {
        Alert.alert(
          'Provider not enabled',
          msg === 'APPLE_PROVIDER_DISABLED'
            ? 'Enable Apple in Supabase → Authentication → Providers → Apple (Services ID, Team ID, Key ID, .p8 secret). Bundle ID: com.physiquemax.ai'
            : 'Enable Google in Supabase → Authentication → Providers → Google (Web client ID + secret from Google Cloud Console).',
        );
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
      if (msg === 'APPLE_PROVIDER_DISABLED') {
        Alert.alert(
          'Apple not enabled',
          'Supabase → Authentication → Providers → Apple → Enable. Use bundle ID com.physiquemax.ai and your Apple Developer key (.p8).',
        );
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  return (
    <View style={styles.root}>
      {/* Radial ambient glow at top */}
      <LinearGradient
        colors={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.03)', 'transparent']}
        style={styles.bgGlow}
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

            {/* ── Logo area ──────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.logoArea}>
              <View style={styles.logoMark}>
                <AesthetixLogo variant="mark" width={30} height={30} />
              </View>
              <AesthetixLogo variant="wordmark" width={192} style={styles.logoWordmark} />
              <Text style={styles.logoSub}>{APP_BRAND.tagline}</Text>
            </Animated.View>

            {/* ── Auth card ──────────────────────────────────── */}
            <Animated.View
              entering={FadeInDown.delay(140).duration(500)}
              style={styles.card}
            >

              {/* Mode toggle */}
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  onPress={() => setMode('login')}
                  style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMode('register')}
                  style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Fields */}
              {mode === 'register' && (
                <AnimatedInput
                  label="Full Name"
                  leftIcon={<Ionicons name="person-outline" size={16} color={COLORS.text.muted} />}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  autoCapitalize="words"
                />
              )}

              <AnimatedInput
                label="Email"
                leftIcon={<Ionicons name="mail-outline" size={16} color={COLORS.text.muted} />}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <AnimatedInput
                label="Password"
                leftIcon={<Ionicons name="lock-closed-outline" size={16} color={COLORS.text.muted} />}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <GradientButton
                title={mode === 'login' ? 'Sign In' : 'Create Account'}
                onPress={handleSubmit}
                loading={isLoading}
                size="lg"
                style={{ marginTop: SPACING.sm }}
              />

              {/* Apple Sign In — iOS only */}
              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={RADIUS.full}
                  style={styles.appleBtn}
                  onPress={handleAppleSignIn}
                />
              )}

              {showGoogleSignIn && <GoogleSignInButton disabled={isLoading} />}

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => login('demo@physiquemax.ai', 'demo')}
              >
                <Text style={styles.demoText}>Continue with Demo Account</Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.legal}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </Text>
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
    top: 0,
    left: -60,
    right: -60,
    height: 420,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['3xl'],
  },

  // ── Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  logoWordmark: {
    marginBottom: SPACING.xs,
  },
  logoSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    marginTop: 5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },

  // ── Card
  card: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.xl,
  },

  // ── Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    padding: 3,
    marginBottom: SPACING.xl,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(59,130,246,0.14)',
  },
  modeBtnText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.muted,
  },
  modeBtnTextActive: { color: COLORS.accent },

  // ── Social + secondary buttons
  appleBtn: {
    width: '100%',
    height: 52,
    marginTop: SPACING.md,
  },

  demoBtn: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  demoText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
  },

  // ── Legal
  legal: {
    textAlign: 'center',
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    lineHeight: FONTS.sizes.xs * 1.7,
  },
});
