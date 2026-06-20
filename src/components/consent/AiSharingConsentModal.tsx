import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  AI_PROVIDER_NAME,
  AI_SHARING_CONSENT_LABEL,
  PRIVACY_URL,
} from '../../constants/legal';
import { C, T, R, S } from '../../theme/obsidian';
import { ObsButton } from '../obsidian/ObsButton';

export type AiSharingContext = 'scan' | 'chat';

interface Props {
  visible: boolean;
  context: AiSharingContext;
  onAccept: () => void;
  onCancel: () => void;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export function AiSharingConsentModal({ visible, context, onAccept, onCancel }: Props) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(false);

  const handleAccept = () => {
    if (!checked) {
      setError(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setChecked(false);
    setError(false);
    onAccept();
  };

  const handleCancel = () => {
    setChecked(false);
    setError(false);
    onCancel();
  };

  const contextLead =
    context === 'scan'
      ? 'To analyze your physique photos, Aesthetix sends data to a third-party AI service.'
      : 'To power AI coach chat, Aesthetix sends data to a third-party AI service.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="sparkles" size={20} color={C.volt} />
            </View>
            <Text style={styles.title}>AI data sharing disclosure</Text>
            <Text style={styles.lead}>{contextLead}</Text>

            <Text style={styles.sectionLabel}>What is sent</Text>
            {context === 'scan' ? (
              <>
                <Bullet>Physique photos you upload (front and/or back images).</Bullet>
                <Bullet>Derived fitness scores and measurements for coaching text (no photos in this step).</Bullet>
              </>
            ) : (
              <>
                <Bullet>Your typed chat messages.</Bullet>
                <Bullet>Derived scan results (scores, muscle-group breakdowns, strengths/weaknesses). No photos.</Bullet>
              </>
            )}
            <Bullet>Your name, email, and account ID are not included in requests to the AI provider.</Bullet>

            <Text style={styles.sectionLabel}>Who receives it</Text>
            <Bullet>{AI_PROVIDER_NAME} (third-party AI provider), via our secure Supabase servers.</Bullet>

            <Text style={styles.sectionLabel}>How it is used</Text>
            <Bullet>Only to generate your analysis and coaching. Not for advertising or profiling.</Bullet>

            <Text style={[T.caption, styles.policyLink]}>
              Full details in our{' '}
              <Text
                style={styles.link}
                onPress={() => { void Linking.openURL(PRIVACY_URL).catch(() => {}); }}
              >
                Privacy Policy
              </Text>
              .
            </Text>

            <Pressable
              style={styles.consentRow}
              onPress={() => {
                void Haptics.selectionAsync();
                setChecked((v) => !v);
                setError(false);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
            >
              <View style={[styles.box, checked && styles.boxChecked, error && styles.boxError]}>
                {checked && <Ionicons name="checkmark" size={13} color={C.voltInk} />}
              </View>
              <Text style={styles.consentLabel}>{AI_SHARING_CONSENT_LABEL}</Text>
            </Pressable>
            {error && (
              <Text style={styles.errorText}>Please agree before continuing.</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <ObsButton title="Agree & continue" onPress={handleAccept} glow style={styles.primaryBtn} />
            <Pressable onPress={handleCancel} style={styles.cancelBtn} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
    padding: S.lg,
    paddingBottom: S['2xl'],
  },
  sheet: {
    backgroundColor: C.surface1,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: '88%',
  },
  scrollContent: {
    padding: S.lg,
    paddingBottom: S.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  title: {
    ...T.title,
    color: C.text,
    marginBottom: S.sm,
  },
  lead: {
    ...T.bodySm,
    color: C.text2,
    marginBottom: S.lg,
    lineHeight: 20,
  },
  sectionLabel: {
    ...T.overline,
    color: C.text3,
    marginBottom: S.xs,
    marginTop: S.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: S.sm,
    marginBottom: 6,
    paddingRight: S.sm,
  },
  bulletDot: {
    ...T.bodySm,
    color: C.volt,
    lineHeight: 20,
  },
  bulletText: {
    ...T.bodySm,
    color: C.text2,
    flex: 1,
    lineHeight: 20,
  },
  policyLink: {
    color: C.text3,
    marginTop: S.md,
    lineHeight: 18,
  },
  link: {
    color: C.volt,
    fontFamily: 'Manrope_600SemiBold',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
    marginTop: S.lg,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: C.volt,
    borderColor: C.volt,
  },
  boxError: {
    borderColor: C.danger,
  },
  consentLabel: {
    ...T.caption,
    color: C.text2,
    flex: 1,
    lineHeight: 18,
  },
  errorText: {
    ...T.caption,
    color: C.danger,
    marginTop: S.xs,
  },
  actions: {
    paddingHorizontal: S.lg,
    paddingBottom: S.lg,
    paddingTop: S.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    gap: S.sm,
  },
  primaryBtn: { height: 52 },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...T.bodySm,
    color: C.text3,
    fontFamily: 'Manrope_500Medium',
  },
});
