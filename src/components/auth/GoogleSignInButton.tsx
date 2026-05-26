import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import {
  getGoogleOAuthRedirectUri,
  getGoogleRequestClientIds,
} from '../../auth/googleAuth';
import { mapAuthError } from '../../auth/authErrors';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

interface Props {
  disabled?: boolean;
}

export function GoogleSignInButton({ disabled }: Props) {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const clientIds  = getGoogleRequestClientIds();
  const redirectUri = getGoogleOAuthRedirectUri();

  useEffect(() => {
    if (__DEV__) {
      console.log('[Aesthetix] Google OAuth redirect URI:', redirectUri);
    }
  }, [redirectUri]);

  const [_request, response, promptAsync] = Google.useIdTokenAuthRequest({
    ...clientIds,
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (!id_token) {
        Alert.alert('Error', 'Google Sign In failed — no ID token received.');
        return;
      }
      loginWithGoogle(id_token).catch((err: unknown) => {
        const msg = err instanceof Error ? mapAuthError(err.message) : 'GOOGLE_SIGNIN_FAILED';
        if (msg === 'GOOGLE_PROVIDER_DISABLED') {
          Alert.alert(
            'Google not enabled',
            'Enable Google in Supabase → Authentication → Providers → Google, and paste your Web client ID and secret from Google Cloud Console.',
          );
        } else {
          Alert.alert('Error', msg === 'GOOGLE_SIGNIN_FAILED' ? 'Google Sign In failed' : msg);
        }
      });
    }

    if (response?.type === 'error') {
      const detail = response.error?.message ?? response.params?.error_description ?? 'invalid_request';
      if (__DEV__) console.warn('[auth] Google OAuth error:', response);
      Alert.alert(
        'Google Sign In failed',
        `OAuth error (${detail}). Add gniewkoscielak@gmail.com under Google Cloud → OAuth consent screen → Test users. Ensure iOS client bundle ID is host.exp.Exponent.`,
      );
    }
  }, [response, loginWithGoogle]);

  return (
    <TouchableOpacity
      style={[styles.btn, disabled && { opacity: 0.5 }]}
      onPress={() => promptAsync()}
      disabled={disabled}
      activeOpacity={0.80}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="logo-google" size={16} color={COLORS.text.secondary} />
      </View>
      <Text style={styles.text}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    height: 52,
    marginTop: SPACING.md,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glass.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.label,
  },
});
