import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/types';
import { navigateToUpgrade } from '../../navigation/navigateToUpgrade';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import {
  canStartScan,
  canUseBackPose,
  hasUnlimitedScans,
} from '../../subscription/tiers';
import { validatePickedImage } from '../../lib/imageValidation';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { ObsCloseButton } from '../../components/obsidian/ObsCloseButton';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { PoseFrame } from './capture/PoseFrame';
import { PoseChip } from './capture/PoseChip';
import { AiSharingNotice } from '../../components/consent/AiSharingNotice';
import { useAiSharingConsent } from '../../hooks/useAiSharingConsent';
import { refreshProfileQuotaFromServer } from '../../subscription/purchases';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;
type Pose = 'front' | 'back';

const POSES: { key: Pose; label: string; requirement: string; reqColor: string; bodyHint: string }[] = [
  { key: 'front', label: 'Front', requirement: 'Required', reqColor: C.volt, bodyHint: 'Face the camera, arms relaxed at your sides.' },
  { key: 'back', label: 'Back', requirement: 'Premium', reqColor: C.info, bodyHint: 'Back to the camera, arms slightly out.' },
];

export function UploadScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [photos, setPhotos] = useState<Partial<Record<Pose, string>>>({});
  const [selected, setSelected] = useState<Pose>('front');
  const { user } = useAuthStore();
  const hydrateHistory = useAnalysisStore((s) => s.hydrate);
  const historyHydrated = useAnalysisStore((s) => s.historyHydrated);

  useEffect(() => {
    void hydrateHistory();
  }, [hydrateHistory]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void refreshProfileQuotaFromServer();
    }, [user?.id]),
  );

  const tier = user?.subscriptionTier ?? 'free';
  const canScan = Boolean(user && historyHydrated && canStartScan(user));

  useEffect(() => {
    if (!__DEV__ || !user || !historyHydrated) return;
    console.log('[upload] scan eligibility', {
      tier,
      freeScanUsed: user.freeScanUsed,
      scansToday: user.scansToday,
      canScan,
    });
  }, [user, historyHydrated, tier, canScan]);
  const backLocked = !canUseBackPose(tier);
  const paidPlan = tier !== 'free';
  const { requireConsent, consentModal } = useAiSharingConsent();
  const photoCount = Object.keys(photos).length;
  const activeMeta = POSES.find((p) => p.key === selected)!;
  const selectedIndex = POSES.findIndex((p) => p.key === selected);
  const currentSaved = Boolean(photos[selected]);
  const showBackNudge = paidPlan && Boolean(photos.front) && !photos.back && selected === 'front';

  const acceptAsset = (pose: Pose, asset: ImagePicker.ImagePickerAsset) => {
    if (backLocked && pose === 'back') {
      navigateToUpgrade(navigation, { reason: 'back_pose' });
      return;
    }
    const validation = validatePickedImage(asset);
    if (!validation.valid) { Alert.alert('Photo not usable', validation.error); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhotos((prev) => ({ ...prev, [pose]: asset.uri }));
    // Stay on this pose so the user sees their photo + READY before choosing the next one.
  };

  const pickPhoto = async (pose: Pose) => {
    if (backLocked && pose === 'back') {
      navigateToUpgrade(navigation, { reason: 'back_pose' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85, allowsEditing: true, aspect: [3, 4] });
    if (!result.canceled && result.assets[0]) acceptAsset(pose, result.assets[0]);
  };

  const takePhoto = async (pose: Pose) => {
    if (backLocked && pose === 'back') {
      navigateToUpgrade(navigation, { reason: 'back_pose' });
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required to take photos.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [3, 4] });
    if (!result.canceled && result.assets[0]) acceptAsset(pose, result.assets[0]);
  };

  const removePhoto = (pose: Pose) => setPhotos((prev) => { const n = { ...prev }; delete n[pose]; return n; });

  const handleAnalyze = () => {
    const uris = hasUnlimitedScans(tier) || tier === 'starter'
      ? (POSES.map((p) => photos[p.key]).filter(Boolean) as string[])
      : (photos.front ? [photos.front] : []);
    if (!canScan) {
      navigateToUpgrade(navigation, {
        reason: 'scan_limit',
        pendingImageUris: uris.length > 0 ? uris : undefined,
        suggestedPlan: tier === 'starter' ? 'monthly' : undefined,
      });
      return;
    }
    if (!photos.front) {
      Alert.alert('Front photo required', 'Add a front-facing photo before running analysis.');
      return;
    }
    const urisToAnalyze = uris;
    requireConsent('scan', () => {
      navigation.replace('AnalysisLoading', { imageUris: urisToAnalyze });
    });
  };

  const hasFront = Boolean(photos.front);
  const ctaTitle = !canScan
    ? 'Upgrade to unlock scans'
    : !hasFront
      ? photoCount === 0 ? 'Add front photo to begin' : 'Add front photo to continue'
      : `Analyze ${photoCount} photo${photoCount > 1 ? 's' : ''}`;

  return (
    <View style={styles.root}>
      <AmbientGlow />
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <ObsCloseButton onPress={() => navigation.goBack()} />
          <View style={styles.headerCenter}>
            <Text style={[T.cardTitle, { color: C.text }]}>Capture Studio</Text>
            <Text style={[T.caption, { color: currentSaved ? C.volt : C.text3 }]}>
              {activeMeta.label}{currentSaved ? ' · Saved' : ` · ${selectedIndex + 1} of ${POSES.length}`}
            </Text>
          </View>
        </View>

        {/* Hero frame */}
        <Animated.View key={selected} entering={reduceMotion ? undefined : FadeIn.duration(220)} style={styles.frameArea}>
          <PoseFrame
            pose={selected}
            label={activeMeta.label}
            requirement={activeMeta.requirement}
            reqColor={activeMeta.reqColor}
            bodyHint={activeMeta.bodyHint}
            uri={photos[selected]}
            reduceMotion={reduceMotion}
            onCamera={() => takePhoto(selected)}
            onGallery={() => pickPhoto(selected)}
            onRemove={() => removePhoto(selected)}
          />
        </Animated.View>

        {showBackNudge && (
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setSelected('back'); }}
            style={styles.nudge}
            accessibilityRole="button"
            accessibilityLabel="Add back photo, recommended"
          >
            <Ionicons name="checkmark-circle" size={14} color={C.volt} />
            <Text style={[T.caption, { color: C.text2, flex: 1 }]}>
              Front saved — tap <Text style={{ color: C.volt, fontFamily: 'Manrope_600SemiBold' }}>Back</Text> to add a rear photo
            </Text>
            <Ionicons name="chevron-forward" size={14} color={C.text3} />
          </Pressable>
        )}

        {/* Filmstrip */}
        <View style={styles.filmstrip}>
          {POSES.map((p) => (
            <PoseChip
              key={p.key}
              pose={p.key}
              label={p.label}
              uri={photos[p.key]}
              active={selected === p.key}
              locked={p.key === 'back' && backLocked}
              onPress={() => {
                if (p.key === 'back' && backLocked) {
                  navigateToUpgrade(navigation, { reason: 'back_pose' });
                  return;
                }
                Haptics.selectionAsync();
                setSelected(p.key);
              }}
            />
          ))}
        </View>

        {/* Footer */}
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(300)} style={styles.footer}>
          {!canScan && (
            <View style={styles.limitBanner}>
              <Ionicons name="lock-closed-outline" size={15} color={C.danger} />
              <Text style={[T.caption, { color: C.text2, flex: 1 }]}>
                {tier === 'starter'
                  ? "Today's scan used — upgrade to Pro for unlimited."
                  : 'Free scan used — choose a plan to continue.'}
              </Text>
            </View>
          )}
          <ObsButton
            title={ctaTitle}
            onPress={handleAnalyze}
            glow={canScan && hasFront}
            disabled={canScan && !hasFront}
            icon={canScan && hasFront ? 'sparkles' : undefined}
            style={{ height: 56 }}
          />
          <AiSharingNotice />
        </Animated.View>
      </View>
      {consentModal}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, paddingBottom: S.sm,
    flexShrink: 0,
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 1, marginRight: 40 },

  frameArea: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: LAYOUT.screenX,
    marginBottom: S.xs,
  },

  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginHorizontal: LAYOUT.screenX,
    marginBottom: S.xs,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    backgroundColor: C.voltDim,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.voltBorder,
    flexShrink: 0,
  },

  filmstrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: S.base,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.xs,
    paddingBottom: S.sm,
    flexShrink: 0,
  },

  footer: { paddingHorizontal: LAYOUT.screenX, paddingTop: S.xs, paddingBottom: S.sm, gap: S.md, flexShrink: 0 },
  limitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: 'rgba(255,92,92,0.10)', borderWidth: 1, borderColor: 'rgba(255,92,92,0.28)',
    borderRadius: R.md, padding: S.md,
  },
});
