import React from 'react';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { formatSubscriptionDate } from '../../../subscription/subscription';

interface CancelSubscriptionModalProps {
  visible: boolean;
  periodEnd: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelSubscriptionModal({
  visible,
  periodEnd,
  loading,
  onConfirm,
  onCancel,
}: CancelSubscriptionModalProps) {
  const endLabel = periodEnd ? formatSubscriptionDate(periodEnd) : 'the end of your billing period';

  return (
    <ConfirmModal
      visible={visible}
      title="Cancel subscription?"
      message={
        `You'll keep full Premium access until ${endLabel}. After that, your account switches to the free plan (1 scan/day). You can resubscribe anytime.`
      }
      confirmLabel="Yes, cancel"
      cancelLabel="Keep subscription"
      destructive
      emphasizeCancelAction
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
