import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { getGoogleAuthConfig } from '../../auth/googleAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

interface Props {
  disabled?: boolean;
}

export function GoogleSignInButton({ disabled }: Props) {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const config = getGoogleAuthConfig();

  const [_request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      loginWithGoogle(id_token).catch((err: unknown) => {
        Alert.alert('Error', err instanceof Error ? err.message : 'Google Sign In failed');
      });
    }
  }, [response, loginWithGoogle]);

  return (
    <TouchableOpacity
      style={styles.googleBtn}
      onPress={() => promptAsync()}
      disabled={disabled}
    >
      <Ionicons name="logo-google" size={18} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.googleText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 50,
    marginTop: SPACING.md,
  },
  googleText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
});
