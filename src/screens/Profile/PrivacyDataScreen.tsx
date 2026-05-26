import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/common/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyData'>;

const PRIVACY_URL = 'https://physiquemax.ai/privacy';
const TERMS_URL = 'https://physiquemax.ai/terms';

export function PrivacyDataScreen({ navigation }: Props) {
  const { deleteAccount, isLoading } = useAuthStore();
  const scanCount = useAnalysisStore((s) => s.history.length);

  const openLink = (url: string, label: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(label, 'Could not open the link. Visit physiquemax.ai in your browser.');
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
              Alert.alert(
                'Could not delete account',
                err instanceof Error ? err.message : 'Please try again later.',
              );
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader variant="push" title="Privacy & Data" subtitle="Your data, your control" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <GlassCard style={{ marginBottom: SPACING.base }}>
              <Text style={styles.sectionTitle}>Your data</Text>
              <Text style={styles.body}>
                Scan photos and AI analysis results are stored securely and linked to your account.
                You currently have {scanCount} scan{scanCount === 1 ? '' : 's'} saved.
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(350)}>
            <GlassCard style={{ marginBottom: SPACING.base }}>
              {[
                { icon: 'document-text-outline' as const, label: 'Privacy Policy', url: PRIVACY_URL },
                { icon: 'reader-outline' as const, label: 'Terms of Service', url: TERMS_URL },
              ].map((item, i, arr) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => openLink(item.url, item.label)}
                  style={[styles.linkRow, i < arr.length - 1 && styles.rowBorder]}
                >
                  <Ionicons name={item.icon} size={16} color={COLORS.text.secondary} />
                  <Text style={styles.linkLabel}>{item.label}</Text>
                  <Ionicons name="open-outline" size={14} color={COLORS.text.disabled} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(350)}>
            <GlassCard>
              <Text style={styles.sectionTitle}>Delete account</Text>
              <Text style={styles.body}>
                Permanently remove your account and all associated scans from our servers.
              </Text>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={styles.deleteBtn}
                disabled={isLoading}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                <Text style={styles.deleteLabel}>Delete my account</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: LAYOUT.pagePad, paddingBottom: SPACING['3xl'] },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  body: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    lineHeight: FONTS.sizes.sm * 1.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.hairline,
  },
  linkLabel: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.primary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  deleteLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.red,
  },
});
