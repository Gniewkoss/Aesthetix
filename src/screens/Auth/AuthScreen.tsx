import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/ui/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isLoading } = useAuthStore();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (mode === 'register' && !name) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }
    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(name, email, password);
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
