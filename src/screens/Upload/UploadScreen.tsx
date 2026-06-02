import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { validatePickedImage } from '../../lib/imageValidation';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';
import { ObsButton } from '../../components/obsidian/ObsButton';
import { AmbientGlow } from '../Dashboard/home/AmbientGlow';
import { useReducedMotion } from '../Dashboard/home/useReducedMotion';
import { PoseFrame } from './capture/PoseFrame';
import { PoseChip } from './capture/PoseChip';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;
type Pose = 'front' | 'side' | 'back';

const POSES: { key: Pose; label: string; requirement: string; reqColor: string; bodyHint: string }[] = [
  { key: 'front', label: 'Front', requirement: 'Required', reqColor: C.volt, bodyHint: 'Face the camera, arms relaxed at your sides.' },
  { key: 'back', label: 'Back', requirement: 'Recommended', reqColor: C.info, bodyHint: 'Back to the camera, arms slightly out.' },
  { key: 'side', label: 'Side', requirement: 'Optional', reqColor: C.text3, bodyHint: 'Turn sideways, stand in a neutral pose.' },
];

export function UploadScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [photos, setPhotos] = useState<Partial<Record<Pose, string>>>({});
  const [selected, setSelected] = useState<Pose>('front');
  const { user } = useAuthStore();

  const canScan = user ? (user.isPremium || user.scansToday < user.maxScansPerDay) : false;
  const photoCount = Object.keys(photos).length;
  const activeMeta = POSES.find((p) => p.key === selected)!;
  const selectedIndex = POSES.findIndex((p) => p.key === selected);

  const acceptAsset = (pose: Pose, asset: ImagePicker.ImagePickerAsset) => {
    const validation = validatePickedImage(asset);
    if (!validation.valid) { Alert.alert('Photo not usable', validation.error); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhotos((prev) => {
      const next = { ...prev, [pose]: asset.uri };
      // Auto-advance to the next still-empty pose.
      const firstEmpty = POSES.find((p) => !next[p.key]);
      if (firstEmpty) setSelected(firstEmpty.key);
      return next;
    });
  };

  const pickPhoto = async (pose: Pose) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85, allowsEditing: true, aspect: [3, 4] });
    if (!result.canceled && result.assets[0]) acceptAsset(pose, result.assets[0]);
  };

  const takePhoto = async (pose: Pose) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required to take photos.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [3, 4] });
    if (!result.canceled && result.assets[0]) acceptAsset(pose, result.assets[0]);
  };

  const removePhoto = (pose: Pose) => setPhotos((prev) => { const n = { ...prev }; delete n[pose]; return n; });

  const handleAnalyze = () => {
    const uris = POSES.map((p) => photos[p.key]).filter(Boolean) as string[];
    if (!canScan) {
      Alert.alert('Upgrade to Premium', "You've used your free scan for today. Upgrade for unlimited scans.", [
        { text: 'Not now', style: 'cancel' },
        { text: 'Get Premium', onPress: () => navigation.navigate('ManageSubscription', uris.length > 0 ? { pendingImageUris: uris } : undefined) },
      ]);
      return;
    }
    if (!photos.front) {
      Alert.alert('Front photo required', 'Add a front-facing photo before running analysis.');
      return;
    }
    navigation.replace('AnalysisLoading', { imageUris: uris });
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
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <Ionicons name="close" size={20} color={C.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[T.cardTitle, { color: C.text }]}>Capture Studio</Text>
            <Text style={[T.caption, { color: C.text3 }]}>{activeMeta.label} · {selectedIndex + 1} of {POSES.length}</Text>
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

        {/* Filmstrip */}
        <View style={styles.filmstrip}>
          {POSES.map((p) => (
            <PoseChip
              key={p.key}
              pose={p.key}
              label={p.label}
              uri={photos[p.key]}
              active={selected === p.key}
              onPress={() => { Haptics.selectionAsync(); setSelected(p.key); }}
            />
          ))}
        </View>

        {/* Footer */}
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(300)} style={styles.footer}>
          {!canScan && (
            <View style={styles.limitBanner}>
              <Ionicons name="lock-closed-outline" size={15} color={C.danger} />
              <Text style={[T.caption, { color: C.text2, flex: 1 }]}>Daily free scan used — upgrade to continue.</Text>
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
          <View style={styles.privacyRow}>
            <Ionicons name="shield-checkmark-outline" size={12} color={C.text3} />
            <Text style={[T.caption, { color: C.text3 }]}>Encrypted · analyzed securely · never stored</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, paddingBottom: S.md,
  },
  close: { width: 40, height: 40, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  headerCenter: { flex: 1, alignItems: 'center', gap: 1, marginRight: 40 },

  frameArea: { flex: 1, paddingHorizontal: LAYOUT.screenX, paddingVertical: S.md },

  filmstrip: { flexDirection: 'row', gap: S.md, paddingHorizontal: LAYOUT.screenX, paddingVertical: S.md },

  footer: { paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm, paddingBottom: S.sm, gap: S.md },
  limitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: 'rgba(255,92,92,0.10)', borderWidth: 1, borderColor: 'rgba(255,92,92,0.28)',
    borderRadius: R.md, padding: S.md,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
});
