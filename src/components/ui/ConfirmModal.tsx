import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** When true, the dismiss/keep action is the primary filled button (e.g. cancel-subscription flows). */
  emphasizeCancelAction?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  emphasizeCancelAction = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const keepBtn = (
    <TouchableOpacity
      style={emphasizeCancelAction ? styles.primaryBtn : styles.secondaryBtn}
      onPress={onCancel}
      disabled={loading}
      activeOpacity={0.85}
    >
      <Text
        style={
          emphasizeCancelAction ? styles.primaryBtnText : styles.secondaryBtnText
        }
      >
        {cancelLabel}
      </Text>
    </TouchableOpacity>
  );

  const confirmBtn = (
    <TouchableOpacity
      style={[
        emphasizeCancelAction ? styles.destructiveLinkBtn : styles.primaryBtn,
        !emphasizeCancelAction && destructive && styles.primaryBtnDestructive,
      ]}
      onPress={onConfirm}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading && !emphasizeCancelAction ? (
        <ActivityIndicator color={COLORS.text.onAccent} size="small" />
      ) : (
        <Text
          style={
            emphasizeCancelAction ? styles.destructiveLinkText : styles.primaryBtnText
          }
        >
          {confirmLabel}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {emphasizeCancelAction ? (
            <>
              {keepBtn}
              {confirmBtn}
            </>
          ) : (
            <>
              {confirmBtn}
              {keepBtn}
            </>
          )}
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
    padding: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  sheet: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.borderStrong,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.55,
    marginBottom: SPACING.lg,
  },
  primaryBtn: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  primaryBtnDestructive: {
    backgroundColor: COLORS.red,
  },
  primaryBtnText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: '#fff',
  },
  secondaryBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
  },
  destructiveLinkBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  destructiveLinkText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.red,
  },
});
