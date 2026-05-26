import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/types';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { GradientButton } from '../../components/ui/GradientButton';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

type PhotoSlot = 'front' | 'side' | 'back';

const SLOTS: {
  key: PhotoSlot;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'front', label: 'Front',  hint: 'Face camera, arms relaxed',    icon: 'person-outline' },
  { key: 'side',  label: 'Side',   hint: 'Stand sideways, neutral pose', icon: 'body-outline'   },
  { key: 'back',  label: 'Back',   hint: 'Back to camera, arms down',    icon: 'person-outline' },
];

// Guidance steps shown at the top — replaces the generic tips banner
const GUIDE_STEPS = [
  { num: '01', text: 'Wear minimal clothing for accurate measurements' },
  { num: '02', text: 'Use even, bright lighting — no harsh shadows'    },
  { num: '03', text: 'Stand 1.5–2 m from camera, full body in frame'  },
];

export function UploadScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, string>>>({});
  const { user } = useAuthStore();

  const canScan = user ? (user.isPremium || user.scansToday < user.maxScansPerDay) : false;

  const pickPhoto = async (slot: PhotoSlot) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
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

  const openPremiumPaywall = (pendingImageUris?: string[]) => {
    navigation.navigate('Premium', { pendingImageUris });
  };

  const handleAnalyze = () => {
    const uris = Object.values(photos).filter(Boolean) as string[];

    if (!canScan) {
      Alert.alert(
        'Upgrade to Premium',
        "You've used your free scan for today. Upgrade for unlimited scans — your photos will be analyzed right after.",
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Get Premium', onPress: () => openPremiumPaywall(uris.length > 0 ? uris : undefined) },
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

  const photoCount = Object.keys(photos).length;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader
          variant="push"
          title="Scan Physique"
          subtitle="Add 1–3 photos for accuracy"
          onBack={() => navigation.goBack()}
          rightComponent={<AesthetixLogo variant="mark" width={20} height={20} color={COLORS.cream} />}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Photo guidance — numbered steps, not a dismissible banner */}
          <Animated.View entering={FadeInDown.duration(380)} style={styles.guideCard}>
            {GUIDE_STEPS.map((step) => (
              <View key={step.num} style={styles.guideRow}>
                <Text style={styles.guideNum}>{step.num}</Text>
                <Text style={styles.guideText}>{step.text}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Photo slots */}
          {SLOTS.map((slot, i) => (
            <Animated.View
              key={slot.key}
              entering={FadeInDown.delay(i * 80 + 60).duration(400)}
              style={styles.slotWrapper}
            >
              {/* Slot label */}
              <View style={styles.slotLabelRow}>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                <Text style={styles.slotHint}>{slot.hint}</Text>
              </View>

              {photos[slot.key] ? (
                /* Filled state */
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photos[slot.key] }} style={styles.photo} />
                  {/* Top-right: remove */}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setPhotos((prev) => {
                      const n = { ...prev };
                      delete n[slot.key];
                      return n;
                    })}
                  >
                    <View style={styles.removeBtnInner}>
                      <Ionicons name="close" size={14} color={COLORS.text.primary} />
                    </View>
                  </TouchableOpacity>
                  {/* Bottom-left: confirmation */}
                  <View style={styles.photoConfirm}>
                    <Ionicons name="checkmark-circle" size={13} color={COLORS.green} />
                    <Text style={styles.photoConfirmText}>{slot.label} added</Text>
                  </View>
                </View>
              ) : (
                /* Empty state */
                <View style={styles.emptySlot}>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => takePhoto(slot.key)}
                    activeOpacity={0.78}
                  >
                    <Ionicons name="camera-outline" size={22} color={COLORS.accent} />
                    <Text style={styles.emptyBtnLabel}>Camera</Text>
                  </TouchableOpacity>

                  <View style={styles.emptyDivider} />

                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => pickPhoto(slot.key)}
                    activeOpacity={0.78}
                  >
                    <Ionicons name="images-outline" size={22} color={COLORS.indigo} />
                    <Text style={[styles.emptyBtnLabel, { color: COLORS.indigo }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          ))}

          {/* Scan limit warning */}
          {!canScan && (
            <Animated.View entering={FadeIn.duration(350)} style={styles.limitBanner}>
              <Ionicons name="lock-closed-outline" size={13} color={COLORS.red} />
              <Text style={styles.limitText}>Daily limit reached — tap Analyze to unlock Premium</Text>
            </Animated.View>
          )}

          {/* CTA + privacy note */}
          <View style={styles.ctaSection}>
            <GradientButton
              title={
                !canScan
                  ? 'Upgrade to Unlock Scans'
                  : photoCount === 0
                    ? 'Add Photos to Analyze'
                    : `Analyze ${photoCount} Photo${photoCount > 1 ? 's' : ''}`
              }
              onPress={handleAnalyze}
              variant={!canScan ? 'secondary' : 'primary'}
              size="lg"
              disabled={photoCount === 0 && canScan}
            />
            <View style={styles.privacyRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.text.disabled} />
              <Text style={styles.privacyNote}>Photos analyzed securely — never stored</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: {
    paddingHorizontal: LAYOUT.pagePad,  // 24
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['3xl'],
  },

  // ── Guidance card
  guideCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    padding: LAYOUT.cardPad,            // 24
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  guideNum: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
    letterSpacing: TRACKING.caps,
    opacity: 0.55,
    width: 22,
    lineHeight: FONTS.sizes.sm * 1.5,
  },
  guideText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.sm * 1.55,
  },

  // ── Photo slot
  slotWrapper: { marginBottom: SPACING.xl },
  slotLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  slotLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.heading,
  },
  slotHint: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
  },

  // Filled
  photoContainer: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bg.card,
  },
  photo: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  removeBtnInner: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  photoConfirm: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  photoConfirmText: {
    color: '#fff',
    fontFamily: FONT_FAMILY.bodySemibold,
    fontSize: FONTS.sizes.xs,
  },

  // Empty
  emptySlot: {
    height: 130,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    borderStyle: 'dashed',
    backgroundColor: COLORS.bg.secondary,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 18,
  },
  emptyBtnLabel: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.label,
  },
  emptyDivider: {
    width: StyleSheet.hairlineWidth,
    height: 44,
    backgroundColor: COLORS.border.subtle,
  },

  // ── Limit banner
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

  // ── CTA section
  ctaSection: {
    marginTop: SPACING.sm,
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
