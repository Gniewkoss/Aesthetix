import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { LEGAL_BASE_URL, PRIVACY_URL, TERMS_URL } from '../../constants/legal';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { GroupCard } from '../../components/obsidian/GroupCard';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyData'>;

export function PrivacyDataScreen({ navigation }: Props) {
  const reduceMotion = useReducedMotion();
  const { deleteAccount, isLoading } = useAuthStore();
  const scanCount = useAnalysisStore((s) => s.history.length);

  const openLink = (url: string, label: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(label, `Could not open the link. Visit ${LEGAL_BASE_URL} in your browser.`);
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account, all scans, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            deleteAccount().catch((err: unknown) => {
              Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Please try again later.');
            });
          },
        },
      ],
    );
  };

  const links = [
    { icon: 'document-text-outline' as const, label: 'Privacy Policy', url: PRIVACY_URL },
    { icon: 'reader-outline' as const, label: 'Terms of Service', url: TERMS_URL },
  ];

  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Privacy & Data" subtitle="Your data, your control" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Your data */}
          <Animated.View entering={enter(0)} style={styles.card}>
            <Text style={[T.cardTitle, { color: C.text, fontSize: 16 }]}>Your data</Text>
            <Text style={[T.bodySm, { color: C.text2, marginTop: S.sm }]}>
              Scan photos and AI analysis results are stored securely and linked to your account.
              You currently have {scanCount} scan{scanCount === 1 ? '' : 's'} saved.
            </Text>
          </Animated.View>

          {/* Legal links */}
          <Animated.View entering={enter(1)}>
            <GroupCard spacing="card">
              {links.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => { Haptics.selectionAsync(); openLink(item.url, item.label); }}
                  accessibilityRole="link"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [i < links.length - 1 && styles.border, pressed && styles.pressed]}
                >
                  <View style={styles.linkRow}>
                    <View style={styles.iconTile}>
                      <Ionicons name={item.icon} size={16} color={C.text2} />
                    </View>
                    <Text style={[T.body, { color: C.text, flex: 1, fontSize: 15 }]}>{item.label}</Text>
                    <Ionicons name="open-outline" size={15} color={C.text3} />
                  </View>
                </Pressable>
              ))}
            </GroupCard>
          </Animated.View>

          {/* Delete */}
          <Animated.View entering={enter(2)} style={styles.card}>
            <Text style={[T.cardTitle, { color: C.text, fontSize: 16 }]}>Delete account</Text>
            <Text style={[T.bodySm, { color: C.text2, marginTop: S.sm }]}>
              Permanently remove your account and all associated scans from our servers.
            </Text>
            <Pressable
              onPress={handleDeleteAccount}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Delete my account"
              style={({ pressed }) => [isLoading && styles.dim, pressed && styles.dim]}
            >
              <View style={[styles.deleteAction, { marginTop: S.sm }]}>
                <Ionicons name="trash-outline" size={16} color={C.danger} />
                <Text style={[T.label, { color: C.danger }]}>Delete my account</Text>
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingBottom: S['4xl'] },

  card: {
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: LAYOUT.cardPad },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  pressed: { backgroundColor: C.surface2 },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: R.sm,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  dim: { opacity: 0.5 },
});
