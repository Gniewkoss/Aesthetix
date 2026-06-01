import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { validatePickedImage } from '../../lib/imageValidation';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { staggerDelay, STAGGER_BASE_MS } from '../../motion';
import { ScreenHeader } from '../../components/obsidian/ScreenHeader';
import { GroupCard } from '../../components/obsidian/GroupCard';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { PhotoSlotCard } from './upload/PhotoSlotCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;
type PhotoSlot = 'front' | 'side' | 'back';

const SLOTS: { key: PhotoSlot; label: string; hint: string; hintColor: string; bodyHint: string }[] = [
  { key: 'front', label: 'Front', hint: 'Required', hintColor: C.volt, bodyHint: 'Face camera, arms relaxed at sides' },
  { key: 'side', label: 'Side', hint: 'Recommended', hintColor: C.info, bodyHint: 'Stand sideways, neutral pose' },
  { key: 'back', label: 'Back', hint: 'Optional', hintColor: C.text3, bodyHint: 'Back to camera, arms slightly out' },
];

const SCAN_TIPS = [
  'Even lighting — avoid harsh shadows',
  'Full body in frame, 1.5–2 m from camera',
  'Minimal clothing for best accuracy',
];

export function UploadScreen({ navigation }: Props) {
  const reduceMotion = useReducedMotion();
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, string>>>({});
  const { user } = useAuthStore();

  const canScan = user ? (user.isPremium || user.scansToday < user.maxScansPerDay) : false;
  const photoCount = Object.keys(photos).length;

  const acceptAsset = (slot: PhotoSlot, asset: ImagePicker.ImagePickerAsset) => {
    const validation = validatePickedImage(asset);
    if (!validation.valid) {
      Alert.alert('Photo not usable', validation.error);
      return;
    }
    setPhotos((prev) => ({ ...prev, [slot]: asset.uri }));
  };

  const pickPhoto = async (slot: PhotoSlot) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', quality: 0.85, allowsEditing: true, aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) acceptAsset(slot, result.assets[0]);
  };

  const takePhoto = async (slot: PhotoSlot) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [3, 4] });
    if (!result.canceled && result.assets[0]) acceptAsset(slot, result.assets[0]);
  };

  const removePhoto = (slot: PhotoSlot) =>
    setPhotos((prev) => { const n = { ...prev }; delete n[slot]; return n; });

  const handleAnalyze = () => {
    const uris = Object.values(photos).filter(Boolean) as string[];
    if (!canScan) {
      Alert.alert(
        'Upgrade to Premium',
        "You've used your free scan for today. Upgrade for unlimited scans.",
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Get Premium', onPress: () => navigation.navigate('Premium', { pendingImageUris: uris.length > 0 ? uris : undefined }) },
        ],
      );
      return;
    }
    if (uris.length === 0) {
      Alert.alert('No photos', 'Add at least one photo to analyze.');
      return;
    }
    navigation.replace('AnalysisLoading', { imageUris: uris });
  };

  const enter = (i: number) =>
    reduceMotion ? undefined : FadeInDown.delay(staggerDelay(i)).duration(STAGGER_BASE_MS);

  const ctaTitle = !canScan
    ? 'Upgrade to unlock scans'
    : photoCount === 0
      ? 'Add photos to analyze'
      : `Analyze ${photoCount} photo${photoCount > 1 ? 's' : ''}`;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScreenHeader title="Scan Physique" subtitle="Add 1–3 photos for best results" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Guidance */}
          <Animated.View entering={enter(0)}>
            <GroupCard label="BEFORE YOU SCAN" spacing="card">
              <View style={styles.tipsBlock}>
                {SCAN_TIPS.map((tip) => (
                  <View key={tip} style={styles.tipRow}>
                    <View style={styles.tipDot} />
                    <Text style={[T.bodySm, styles.tipText]}>{tip}</Text>
                  </View>
                ))}
              </View>
            </GroupCard>
          </Animated.View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={[T.overline, { color: C.text3 }]}>YOUR PHOTOS</Text>
            <View style={styles.segments}>
              {SLOTS.map((s) => (
                <View key={s.key} style={[styles.segment, photos[s.key] ? styles.segmentOn : null]} />
              ))}
            </View>
          </View>

          {/* Slots */}
          {SLOTS.map((slot, i) => (
            <Animated.View key={slot.key} entering={enter(i + 1)}>
              <PhotoSlotCard
                label={slot.label}
                hint={slot.hint}
                hintColor={slot.hintColor}
                bodyHint={slot.bodyHint}
                uri={photos[slot.key]}
                onCamera={() => takePhoto(slot.key)}
                onGallery={() => pickPhoto(slot.key)}
                onRemove={() => removePhoto(slot.key)}
              />
            </Animated.View>
          ))}

          {/* Limit banner */}
          {!canScan && (
            <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(300)} style={styles.limitBanner}>
              <Ionicons name="lock-closed-outline" size={16} color={C.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[T.label, { color: C.danger }]}>Daily limit reached</Text>
                <Text style={[T.caption, { color: C.text2, marginTop: 1 }]}>Tap below to unlock Premium and continue</Text>
              </View>
            </Animated.View>
          )}

          {/* CTA */}
          <View style={styles.cta}>
            <ObsButton
              title={ctaTitle}
              onPress={handleAnalyze}
              size="md"
              glow={canScan && photoCount > 0}
              disabled={canScan && photoCount === 0}
              icon={canScan && photoCount > 0 ? 'flash' : undefined}
              style={{ height: 56 }}
            />
            <View style={styles.privacyRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={C.text3} />
              <Text style={[T.caption, { color: C.text3 }]}>Photos analyzed securely · Never stored</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, paddingBottom: S['4xl'] },

  tipsBlock: { padding: LAYOUT.cardPad, gap: S.sm },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.volt,
    marginTop: 7,
  },
  tipText: { flex: 1, color: C.text2, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md },
  segments: { flexDirection: 'row', gap: 5 },
  segment: { width: 22, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.10)' },
  segmentOn: { backgroundColor: C.volt },

  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: 'rgba(255,92,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,92,0.28)',
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.base,
  },

  cta: { marginTop: S.lg, gap: S.md },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
});
