import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/ui/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

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
      <LinearGradient colors={['rgba(123,47,190,0.15)', 'transparent']} style={styles.orb1} />
      <LinearGradient colors={['rgba(0,245,255,0.08)', 'transparent']} style={styles.orb2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.logoArea}>
              <LinearGradient
                colors={['#7B2FBE', '#00F5FF']}
                style={styles.logoIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoEmoji}>⚡</Text>
              </LinearGradient>
              <Text style={styles.logoTitle}>PhysiqueMax AI</Text>
              <Text style={styles.logoSub}>Elite Physique Intelligence</Text>
            </Animated.View>

            {/* Card */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.card}>
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
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Name</Text>
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

              {/* Demo shortcut */}
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => login('demo@physiquemax.ai', 'demo')}
              >
                <Text style={styles.demoText}>Continue with Demo Account →</Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.legal}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  orb1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, top: -150, left: -150 },
  orb2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, bottom: 50, right: -100 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING['3xl'] },
  logoArea: { alignItems: 'center', marginBottom: SPACING['3xl'] },
  logoIcon: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  logoEmoji: { fontSize: 36 },
  logoTitle: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.black, color: COLORS.text.primary },
  logoSub: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 4, letterSpacing: 1 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: SPACING.xl,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  modeBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  modeBtnActive: { backgroundColor: 'rgba(0,245,255,0.15)' },
  modeBtnText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text.muted },
  modeBtnTextActive: { color: COLORS.cyan },
  field: { marginBottom: SPACING.base },
  fieldLabel: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, fontWeight: FONTS.weights.medium, marginBottom: SPACING.xs },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.base,
    height: 52,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
  },
  demoBtn: { marginTop: SPACING.base, alignItems: 'center', padding: SPACING.sm },
  demoText: { color: COLORS.cyan, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium },
  legal: {
    textAlign: 'center',
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    lineHeight: FONTS.sizes.xs * 1.6,
  },
});
