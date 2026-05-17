import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { RootStackParamList } from '../../navigation/types';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { mapAuthError } from '../../auth/authErrors';
import { isGoogleAuthEnabled } from '../../auth/googleAuth';
import { GradientButton } from '../../components/ui/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

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
          'Supabase allows only a few auth emails per hour on the free plan. Wait about an hour, or turn off “Confirm email” in Supabase → Authentication → Providers → Email while developing.',
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
          'Add the Expo redirect URL to Supabase → Authentication → URL Configuration → Redirect URLs (see Metro log: [PhysiqueMax] Add to Supabase…).',
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
      if (code === 'ERR_REQUEST_CANCELED') return; // user dismissed
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
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Logo */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.logoArea}>
              <View style={styles.logoIcon}>
                <Ionicons name="scan" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.logoTitle}>PhysiqueMax</Text>
              <Text style={styles.logoSub}>AI Physique Intelligence</Text>
            </Animated.View>

            {/* Card */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.card}>

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

              {mode === 'register' && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={COLORS.text.disabled}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.text.disabled}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.text.disabled}
                  secureTextEntry
                />
              </View>

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
                  cornerRadius={RADIUS.lg}
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
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING['3xl'] },

  logoArea: { alignItems: 'center', marginBottom: SPACING['3xl'] },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  logoTitle: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  card: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.xl,
  },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    padding: 3,
    marginBottom: SPACING.xl,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  modeBtnActive: { backgroundColor: 'rgba(59,130,246,0.12)' },
  modeBtnText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.muted,
  },
  modeBtnTextActive: { color: COLORS.accent },

  field: { marginBottom: SPACING.base },
  fieldLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: SPACING.base,
    height: 50,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.body,
  },

  appleBtn: {
    width: '100%',
    height: 50,
    marginTop: SPACING.md,
  },

  demoBtn: { marginTop: SPACING.lg, alignItems: 'center', padding: SPACING.sm },
  demoText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
  },

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
