import { useCallback, useState } from 'react';
import { AiSharingConsentModal, AiSharingContext } from '../components/consent/AiSharingConsentModal';
import { useConsentStore } from '../store/useConsentStore';

export function useAiSharingConsent() {
  const hasConsent = useConsentStore((s) => s.hasAiSharingConsent());
  const recordAiSharingConsent = useConsentStore((s) => s.recordAiSharingConsent);
  const [pending, setPending] = useState<{ context: AiSharingContext; onGranted: () => void } | null>(null);

  const requireConsent = useCallback((context: AiSharingContext, onGranted: () => void) => {
    if (hasConsent) {
      onGranted();
      return;
    }
    setPending({ context, onGranted });
  }, [hasConsent]);

  const consentModal = (
    <AiSharingConsentModal
      visible={pending !== null}
      context={pending?.context ?? 'scan'}
      onAccept={() => {
        const action = pending?.onGranted;
        void recordAiSharingConsent().then(() => {
          setPending(null);
          action?.();
        });
      }}
      onCancel={() => setPending(null)}
    />
  );

  return { requireConsent, consentModal, hasAiSharingConsent: hasConsent };
}
