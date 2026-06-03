import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { mapAuthError } from '../../auth/authErrors';
import { useAuthStore } from '../../store/useAuthStore';
import { C, T, R, S } from '../../theme/obsidian';

interface Props {
  disabled?: boolean;
}

/** Custom Apple sign-in — matches Google button size; English label (not system locale). */
export function AppleSignInButton({ disabled }: Props) {
  const loginWithApple = useAuthStore((s) => s.loginWithApple);

  const onPress = useCallback(async () => {
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
        ? `${credential.fullName.givenName}${credential.fullName.familyName ? ` ${credential.fullName.familyName}` : ''}`
        : null;
      await loginWithApple(credential.identityToken, fullName);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      const msg = err instanceof Error ? mapAuthError(err.message) : 'Apple Sign In failed';
      if (msg !== 'APPLE_PROVIDER_DISABLED') Alert.alert('Error', msg);
    }
  }, [loginWithApple]);

  return (
    <Pressable
      style={[styles.btn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Apple"
    >
      <View style={styles.iconWrap}>
        <Ionicons name="logo-apple" size={16} color={C.text} />
      </View>
      <Text style={styles.text}>Continue with Apple</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    height: 52,
    borderRadius: R.md,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.sm,
  },
  btnDisabled: { opacity: 0.5 },
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...T.label,
    color: C.text,
  },
});
