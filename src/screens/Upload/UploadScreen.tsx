import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/ui/GradientButton';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

type PhotoSlot = 'front' | 'side' | 'back';

const SLOTS: { key: PhotoSlot; label: string; icon: keyof typeof Ionicons.glyphMap; hint: string }[] = [
  { key: 'front', label: 'Front View', icon: 'person-outline', hint: 'Face camera, arms relaxed at sides' },
  { key: 'side', label: 'Side View', icon: 'body-outline', hint: 'Stand sideways, neutral posture' },
  { key: 'back', label: 'Back View', icon: 'person-outline', hint: 'Back to camera, arms at sides' },
];

export function UploadScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, string>>>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const { user } = useAuthStore();

  useFocusEffect(useCallback(() => {
    setIsNavigating(false);
  }, []));

  const canScan = user ? (user.isPremium || user.scansToday < user.maxScansPerDay) : false;

  const pickPhoto = async (slot: PhotoSlot) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => ({ ...prev, [slot]: result.assets[0].uri }));
    }
  };

  const takePhoto = async (slot: PhotoSlot) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => ({ ...prev, [slot]: result.assets[0].uri }));
    }
  };

  const handleAnalyze = () => {
    if (!canScan) {
      navigation.navigate('Premium');
      return;
    }
    const uris = Object.values(photos).filter(Boolean) as string[];
    if (uris.length === 0) {
      Alert.alert('No photos', 'Please add at least one photo to analyze.');
      return;
    }
    setIsNavigating(true);
    navigation.push('AnalysisLoading', { imageUris: uris });
  };

  const photoCount = Object.keys(photos).length;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          title="Scan Physique"
          subtitle="Add 1–3 photos for accurate results"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Tips banner */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tipsBanner}>
            <View style={styles.tipsIconWrap}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
            </View>
            <Text style={styles.tipsText}>
              Wear minimal clothing and ensure good, even lighting for best results.
            </Text>
          </Animated.View>

          {/* Photo slots */}
          {SLOTS.map((slot, i) => (
            <Animated.View key={slot.key} entering={FadeInDown.delay(i * 80).duration(400)} style={styles.slotWrapper}>
              <View style={styles.slotLabelRow}>
                <Ionicons name={slot.icon} size={14} color={COLORS.text.muted} />
                <Text style={styles.slotLabel}>{slot.label}</Text>
              </View>
              <Text style={styles.slotHint}>{slot.hint}</Text>

              {photos[slot.key] ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photos[slot.key] }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => setPhotos((prev) => { const n = { ...prev }; delete n[slot.key]; return n; })}
                  >
                    <Ionicons name="close-circle" size={26} color={COLORS.red} />
                  </TouchableOpacity>
                  <View style={styles.photoCheckRow}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                    <Text style={styles.photoLabel}>{slot.label}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => takePhoto(slot.key)}>
                    <View style={styles.emptyBtnIcon}>
                      <Ionicons name="camera-outline" size={20} color={COLORS.accent} />
                    </View>
                    <Text style={styles.emptyBtnText}>Camera</Text>
                  </TouchableOpacity>
                  <View style={styles.emptyDivider} />
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => pickPhoto(slot.key)}>
                    <View style={[styles.emptyBtnIcon, { backgroundColor: COLORS.purpleDim, borderColor: COLORS.purpleBorder }]}>
                      <Ionicons name="images-outline" size={20} color={COLORS.purple} />
                    </View>
                    <Text style={[styles.emptyBtnText, { color: COLORS.purple }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          ))}

          {/* Scan limit warning */}
          {!canScan && (
            <Animated.View entering={FadeIn.duration(350)} style={styles.limitBanner}>
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.red} />
              <Text style={styles.limitText}>Daily scan limit reached — upgrade to continue</Text>
            </Animated.View>
          )}

          {/* CTA */}
          <View style={{ marginTop: SPACING.xl, marginBottom: SPACING['2xl'] }}>
            <GradientButton
              title={!canScan ? 'Upgrade to Unlock Scans' : photoCount === 0 ? 'Add Photos to Analyze' : `Analyze ${photoCount} Photo${photoCount > 1 ? 's' : ''}`}
              onPress={handleAnalyze}
              loading={isNavigating}
              variant={!canScan ? 'secondary' : 'primary'}
              size="lg"
              disabled={photoCount === 0 && canScan}
            />
            <View style={styles.privacyRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.text.disabled} />
              <Text style={styles.privacyNote}>Photos are analyzed securely and never stored</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },

  tipsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  tipsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipsText: {
    flex: 1,
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    lineHeight: FONTS.sizes.xs * 1.6,
  },

  slotWrapper: { marginBottom: SPACING.xl },
  slotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  slotLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  slotHint: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginBottom: SPACING.md,
  },

  photoContainer: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bg.card,
  },
  photo: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  photoCheckRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  photoLabel: {
    color: '#fff',
    fontFamily: FONT_FAMILY.bodySemibold,
    fontSize: FONTS.sizes.xs,
  },

  emptySlot: {
    height: 140,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  emptyBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  emptyDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.07)' },

  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.redDim,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  limitText: {
    color: COLORS.red,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    flex: 1,
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: SPACING.md,
  },
  privacyNote: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
  },
});
