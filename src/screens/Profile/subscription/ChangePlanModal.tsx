import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { PREMIUM_PLANS } from '../../../constants';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import { ObsButton } from '../../../components/obsidian/ObsButton';
import { CancelSubscriptionButton } from './CancelSubscriptionButton';
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
  useEffect(() => { if (visible) setSelected(currentPlanId); }, [visible, currentPlanId]);
  const hasChange = selected !== currentPlanId;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={[T.title, { color: C.text }]}>Change plan</Text>
          <Text style={[T.bodySm, { color: C.text3, marginTop: 4, marginBottom: S.base }]}>
            Upgrades apply immediately. Downgrades take effect next cycle.
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {PREMIUM_PLANS.map((plan) => {
              const isSelected = selected === plan.id;
              const isCurrent = currentPlanId === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelected(plan.id as SubscriptionPlanId)}
                  style={[styles.planRow, isSelected && styles.planRowSelected]}
                >
                  <View style={[styles.radio, isSelected && styles.radioOn]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planNameRow}>
                      <Text style={[T.body, { color: C.text, fontSize: 15 }]}>{plan.name}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={[T.overline, { color: C.text3 }]}>CURRENT</Text>
                        </View>
                      )}
                    </View>
                    {'subtitle' in plan && plan.subtitle ? (
                      <Text style={[T.caption, { color: C.text3, marginTop: 2 }]}>{plan.subtitle}</Text>
                    ) : (
                      <Text style={[T.caption, { color: C.text3, marginTop: 2 }]}>{plan.features[0]}</Text>
                    )}
                  </View>
                  <Text style={[T.label, { color: C.text }]}>
                    {plan.price}<Text style={[T.caption, { color: C.text3 }]}>/{plan.period}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ObsButton
            title={hasChange ? 'Confirm plan change' : 'Select a different plan'}
            onPress={() => hasChange && onConfirm(selected)}
            disabled={!hasChange}
            loading={loading}
            glow={hasChange}
            style={{ marginTop: S.base }}
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
    maxHeight: '80%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderHi, alignSelf: 'center', marginTop: S.sm, marginBottom: S.base },
  list: { maxHeight: 300 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.base,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.sm,
    backgroundColor: C.surface2,
  },
  planRowSelected: { borderColor: C.voltBorder, backgroundColor: C.voltDim },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.borderMd, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.volt },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.volt },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentBadge: { backgroundColor: C.surface3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: R.xs, borderWidth: 1, borderColor: C.border },
  dismissLink: { alignItems: 'center', paddingVertical: S.md, marginTop: S.xs },
  cancelSubBtn: { marginTop: S.sm },
});
