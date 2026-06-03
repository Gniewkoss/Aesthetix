import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import { ObsButton } from '../../../components/obsidian/ObsButton';
import { formatSubscriptionDate } from '../../../subscription/subscription';

interface CancelSubscriptionModalProps {
  visible: boolean;
  periodEnd: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelSubscriptionModal({ visible, periodEnd, loading, onConfirm, onCancel }: CancelSubscriptionModalProps) {
  const endLabel = periodEnd ? formatSubscriptionDate(periodEnd) : 'the end of your billing period';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle-outline" size={24} color={C.danger} />
          </View>
          <Text style={[T.title, { color: C.text, textAlign: 'center' }]}>Cancel subscription?</Text>
          <Text style={[T.bodySm, { color: C.text2, textAlign: 'center', marginTop: S.sm, lineHeight: 21 }]}>
            You'll keep full Premium access until {endLabel}. After that, your account switches to the free plan (1 scan/day). You can resubscribe anytime.
          </Text>

          {/* Keep is emphasized (primary); cancelling is the destructive secondary. */}
          <ObsButton title="Keep subscription" onPress={onCancel} glow style={{ width: '100%', marginTop: S.lg }} />
          <ObsButton title="Yes, cancel" onPress={onConfirm} variant="destructive" loading={loading} style={{ width: '100%', marginTop: S.sm }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: LAYOUT.screenX,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: C.surface3,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.borderMd,
    padding: LAYOUT.cardPad,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: R.md,
    backgroundColor: 'rgba(255,92,92,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,92,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.base,
  },
});
