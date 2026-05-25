import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PREMIUM_PLANS } from '../../../constants';
import { GradientButton } from '../../../components/ui/GradientButton';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../../theme';
import type { SubscriptionPlanId } from '../../../subscription/subscription';

interface ChangePlanModalProps {
  visible: boolean;
  currentPlanId: SubscriptionPlanId;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (planId: SubscriptionPlanId) => void;
}

export function ChangePlanModal({
  visible,
  currentPlanId,
  loading,
  onClose,
  onConfirm,
}: ChangePlanModalProps) {
  const [selected, setSelected] = useState<SubscriptionPlanId>(currentPlanId);

  useEffect(() => {
    if (visible) setSelected(currentPlanId);
  }, [visible, currentPlanId]);

  const hasChange = selected !== currentPlanId;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Change plan</Text>
          <Text style={styles.subtitle}>Upgrades apply immediately. Downgrades take effect next cycle.</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {PREMIUM_PLANS.map((plan) => {
              const isSelected = selected === plan.id;
              const isCurrent = currentPlanId === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planRow, isSelected && styles.planRowSelected]}
                  onPress={() => setSelected(plan.id as SubscriptionPlanId)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.radio, isSelected && styles.radioOn]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planFeatures}>{plan.features[0]}</Text>
                  </View>
                  <Text style={styles.planPrice}>
                    {plan.price}
                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <GradientButton
            title={hasChange ? 'Confirm plan change' : 'Select a different plan'}
            onPress={() => hasChange && onConfirm(selected)}
            disabled={!hasChange}
            loading={loading}
            variant="secondary"
            size="md"
            style={{ marginTop: SPACING.base }}
          />
          <TouchableOpacity onPress={onClose} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg.elevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.borderStrong,
    borderBottomWidth: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    maxHeight: '78%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 4,
    marginBottom: SPACING.base,
    lineHeight: FONTS.sizes.xs * 1.5,
  },
  list: { maxHeight: 280 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.glass.bg,
  },
  planRowSelected: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleDim,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: COLORS.purple },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.purple },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  currentBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  currentBadgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.muted,
    letterSpacing: 0.4,
  },
  planFeatures: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  planPrice: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.primary,
  },
  planPeriod: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  cancelLink: { alignItems: 'center', paddingVertical: SPACING.md },
  cancelLinkText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
  },
});
