import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import { ObsButton } from '../../../components/obsidian/ObsButton';
import { CancelSubscriptionButton } from './CancelSubscriptionButton';
import { ManagePlanPicker } from './ManagePlanPicker';
import { planById } from '../../Subscription/paywall/PlanOfferCard';
import type { SubscriptionPlanId } from '../../../subscription/subscription';

interface ChangePlanModalProps {
  visible: boolean;
  currentPlanId: SubscriptionPlanId;
  loading?: boolean;
  showCancelSubscription?: boolean;
  onClose: () => void;
  onConfirm: (planId: SubscriptionPlanId) => void;
  onCancelSubscription?: () => void;
}

export function ChangePlanModal({
  visible,
  currentPlanId,
  loading,
  showCancelSubscription,
  onClose,
  onConfirm,
  onCancelSubscription,
}: ChangePlanModalProps) {
  const [selected, setSelected] = useState<SubscriptionPlanId>(currentPlanId);
  useEffect(() => {
    if (visible) setSelected(currentPlanId);
  }, [visible, currentPlanId]);

  const hasChange = selected !== currentPlanId;
  const selectedMeta = planById(selected);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={[T.title, { color: C.text }]}>Choose your plan</Text>
          <Text style={[T.bodySm, { color: C.text3, marginTop: 4, marginBottom: S.md }]}>
            Starter · 1 scan/day · Pro unlimited · Max adds coach chat
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <ManagePlanPicker
              selected={selected}
              currentPlanId={currentPlanId}
              onSelect={setSelected}
            />
          </ScrollView>

          <ObsButton
            title={hasChange ? `Switch to ${selectedMeta.name}` : 'Select a different plan'}
            onPress={() => hasChange && onConfirm(selected)}
            disabled={!hasChange}
            loading={loading}
            glow={hasChange}
            icon={hasChange ? 'flash' : undefined}
            style={{ marginTop: S.sm }}
          />

          <Pressable onPress={onClose} style={styles.dismissLink} accessibilityRole="button" accessibilityLabel="Not now">
            <Text style={[T.label, { color: C.text2 }]}>Not now</Text>
          </Pressable>

          {showCancelSubscription && onCancelSubscription ? (
            <CancelSubscriptionButton
              onPress={onCancelSubscription}
              disabled={loading}
              style={styles.cancelSubBtn}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface3,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    borderWidth: 1,
    borderColor: C.borderMd,
    borderBottomWidth: 0,
    paddingHorizontal: LAYOUT.cardPad,
    paddingBottom: S['2xl'],
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderHi,
    alignSelf: 'center',
    marginTop: S.sm,
    marginBottom: S.base,
  },
  list: { maxHeight: 420 },
  dismissLink: { alignItems: 'center', paddingVertical: S.md, marginTop: S.xs },
  cancelSubBtn: { marginTop: S.sm },
});
