import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/types';
import { AesthetixLogo } from '../../components/brand/AesthetixLogo';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuthStore } from '../../store/useAuthStore';
import {
  COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING,
} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;
type PhotoSlot = 'front' | 'side' | 'back';

const SLOTS: {
  key: PhotoSlot;
  label: string;
  hint: string;
  bodyHint: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'front', label: 'Front',  hint: 'Most important',              bodyHint: 'Face camera, arms relaxed at sides',    icon: 'person-outline' },
  { key: 'side',  label: 'Side',   hint: 'Recommended',                 bodyHint: 'Stand sideways, neutral pose',          icon: 'body-outline'   },
  { key: 'back',  label: 'Back',   hint: 'Optional',                    bodyHint: 'Back to camera, arms slightly out',     icon: 'person-outline' },
];

// Numbered guide steps
const STEPS = [
  { num: 1, icon: 'sunny-outline'   as const, text: 'Even, bright lighting — no harsh shadows' },
  { num: 2, icon: 'scan-outline'    as const, text: 'Full body in frame, 1.5–2 m from camera'  },
  { num: 3, icon: 'body-outline'    as const, text: 'Minimal clothing for accurate measurements' },
] as const;

export function UploadScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, string>>>({});
  const { user } = useAuthStore();

  const canScan = user ? (user.isPremium || user.scansToday < user.maxScansPerDay) : false;
  const photoCount = Object.keys(photos).length;

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

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader
          variant="push"
          title="Scan Physique"
          subtitle="Add 1–3 photos for best results"
          onBack={() => navigation.goBack()}
          rightComponent={<AesthetixLogo variant="mark" width={20} height={20} color={COLORS.cream} />}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Photo guidance ───────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Badge variant="secondary" size="sm">Photo Guidelines</Badge>
            </View>
            <View style={styles.guideSteps}>
              {STEPS.map((step) => (
                <View key={step.num} style={styles.guideStep}>
                  <View style={styles.guideStepNum}>
                    <Text style={styles.guideStepNumText}>{step.num}</Text>
                  </View>
                  <Ionicons name={step.icon} size={14} color={COLORS.text.muted} />
                  <Text style={styles.guideStepText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Photo slots ──────────────────────────── */}
          {SLOTS.map((slot, i) => (
            <Animated.View
              key={slot.key}
              entering={FadeInDown.delay(i * 80 + 60).duration(380)}
              style={styles.slotSection}
            >
              {/* Slot header */}
              <View style={styles.slotHeader}>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                <Badge
                  variant={i === 0 ? 'default' : i === 1 ? 'secondary' : 'outline'}
                  size="sm"
                >
                  {slot.hint}
                </Badge>
              </View>
              <Text style={styles.slotBodyHint}>{slot.bodyHint}</Text>

              {photos[slot.key] ? (
                /* ── Filled state */
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photos[slot.key] }} style={styles.photo} />

                  {/* Success overlay bar */}
                  <View style={styles.photoSuccessBar}>
                    <View style={styles.photoSuccessLeft}>
                      <Ionicons name="checkmark-circle" size={13} color={COLORS.green} />
                      <Text style={styles.photoSuccessText}>{slot.label} photo added</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setPhotos((prev) => { const n = { ...prev }; delete n[slot.key]; return n; })}
                      style={styles.photoRemoveBtn}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      accessibilityLabel={`Remove ${slot.label} photo`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="close" size={13} color={COLORS.text.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ── Empty state */
                <View style={styles.slotEmpty}>
                  <TouchableOpacity
                    style={styles.slotBtn}
                    onPress={() => takePhoto(slot.key)}
                    activeOpacity={0.78}
                  >
                    <View style={styles.slotBtnIcon}>
                      <Ionicons name="camera-outline" size={20} color={COLORS.accent} />
                    </View>
                    <Text style={[styles.slotBtnLabel, { color: COLORS.accent }]}>Camera</Text>
                  </TouchableOpacity>

                  <View style={styles.slotDivider} />

                  <TouchableOpacity
                    style={styles.slotBtn}
                    onPress={() => pickPhoto(slot.key)}
                    activeOpacity={0.78}
                  >
                    <View style={[styles.slotBtnIcon, { backgroundColor: COLORS.indigoDim }]}>
                      <Ionicons name="images-outline" size={20} color={COLORS.indigo} />
                    </View>
                    <Text style={[styles.slotBtnLabel, { color: COLORS.indigo }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          ))}

          {/* ── Scan limit banner */}
          {!canScan && (
            <Animated.View entering={FadeIn.duration(350)} style={styles.limitBanner}>
              <Ionicons name="lock-closed-outline" size={13} color={COLORS.red} />
              <Text style={styles.limitText}>Daily limit reached — tap Analyze to unlock Premium</Text>
            </Animated.View>
          )}

          {/* ── CTA section ──────────────────────────── */}
          <View style={styles.cta}>
            <Button
              variant={!canScan ? 'secondary' : 'default'}
              size="lg"
              onPress={handleAnalyze}
              disabled={photoCount === 0 && canScan}
              trailingIcon={
                photoCount > 0 && canScan
                  ? <Ionicons name="flash" size={14} color="#fff" />
                  : undefined
              }
            >
              {!canScan
                ? 'Upgrade to Unlock Scans'
                : photoCount === 0
                  ? 'Add Photos to Analyze'
                  : `Analyze ${photoCount} Photo${photoCount > 1 ? 's' : ''}`}
            </Button>

            <View style={styles.privacyRow}>
              <Ionicons name="shield-checkmark-outline" size={11} color={COLORS.text.disabled} />
              <Text style={styles.privacyNote}>Photos analyzed securely · Never stored</Text>
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
    paddingHorizontal: LAYOUT.pagePad,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['3xl'],
  },

  // ── Guide card
  guideCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  guideHeader: {
    marginBottom: SPACING.md,
  },
  guideSteps: { gap: SPACING.sm },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  guideStepNum: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.creamDim,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guideStepNumText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.cream,
  },
  guideStepText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.secondary,
  },

  // ── Slot section
  slotSection: { marginBottom: SPACING.xl },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  slotLabel: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  slotBodyHint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginBottom: SPACING.sm,
  },

  // Filled photo
  photoContainer: {
    height: 220,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.bg.card,
  },
  photo: { width: '100%', height: '100%' },
  photoSuccessBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.60)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  photoSuccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoSuccessText: {
    color: '#fff',
    fontFamily: FONT_FAMILY.bodySemibold,
    fontSize: FONTS.sizes.xs,
  },
  photoRemoveBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  // Empty slot
  slotEmpty: {
    height: 140,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    borderStyle: 'dashed',
    backgroundColor: COLORS.bg.secondary,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  slotBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  slotBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.label,
  },
  slotDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: SPACING.xl,
    backgroundColor: COLORS.border.subtle,
  },

  // Limit banner
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

  // CTA
  cta: {
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  privacyNote: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
  },
});
