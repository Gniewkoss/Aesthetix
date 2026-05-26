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
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { PageHeader } from '../../components/common/PageHeader';
import { SettingsSection } from '../../components/common/SettingsSection';
import { InfoRow } from '../../components/common/InfoRow';
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
  { key: 'front', label: 'Front', hint: 'Required', bodyHint: 'Face camera, arms relaxed at sides', icon: 'person-outline' },
  { key: 'side', label: 'Side', hint: 'Recommended', bodyHint: 'Stand sideways, neutral pose', icon: 'body-outline' },
  { key: 'back', label: 'Back', hint: 'Optional', bodyHint: 'Back to camera, arms slightly out', icon: 'person-outline' },
];

const STEPS = [
  { icon: 'sunny-outline' as const, title: 'Even lighting', description: 'Bright, even light — no harsh shadows' },
  { icon: 'scan-outline' as const, title: 'Full body in frame', description: 'Stand 1.5–2 m from the camera' },
  { icon: 'body-outline' as const, title: 'Minimal clothing', description: 'Better accuracy for measurements' },
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

          <Animated.View entering={FadeInDown.duration(350)}>
            <SettingsSection label="Before you scan" noTopMargin>
              {STEPS.map((step, i) => (
                <InfoRow
                  key={step.title}
                  title={step.title}
                  subtitle={step.description}
                  showBorder={i < STEPS.length - 1}
                  leftContent={
                    <View style={styles.stepIcon}>
                      <Ionicons name={step.icon} size={15} color={COLORS.accent} />
                    </View>
                  }
                />
              ))}
            </SettingsSection>
          </Animated.View>

          {SLOTS.map((slot, i) => (
            <Animated.View key={slot.key} entering={FadeInDown.delay(i * 80 + 60).duration(380)}>
              <SettingsSection label={slot.label}>
                <View style={styles.slotMeta}>
                  <Text style={styles.slotHint}>{slot.hint}</Text>
                  <Text style={styles.slotBodyHint}>{slot.bodyHint}</Text>
                </View>

                {photos[slot.key] ? (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: photos[slot.key] }} style={styles.photo} />
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
                  <View style={styles.slotEmpty}>
                    <TouchableOpacity style={styles.slotBtn} onPress={() => takePhoto(slot.key)} activeOpacity={0.78}>
                      <View style={styles.slotBtnIcon}>
                        <Ionicons name="camera-outline" size={22} color={COLORS.accent} />
                      </View>
                      <Text style={[styles.slotBtnLabel, { color: COLORS.accent }]}>Camera</Text>
                    </TouchableOpacity>
                    <View style={styles.slotDivider} />
                    <TouchableOpacity style={styles.slotBtn} onPress={() => pickPhoto(slot.key)} activeOpacity={0.78}>
                      <View style={[styles.slotBtnIcon, { backgroundColor: COLORS.indigoDim }]}>
                        <Ionicons name="images-outline" size={22} color={COLORS.indigo} />
                      </View>
                      <Text style={[styles.slotBtnLabel, { color: COLORS.indigo }]}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </SettingsSection>
            </Animated.View>
          ))}

          {!canScan && (
            <Animated.View entering={FadeIn.duration(350)}>
              <GlassCard style={styles.limitBanner}>
                <InfoRow
                  title="Daily limit reached"
                  subtitle="Tap Analyze to unlock Premium and continue"
                  leftContent={<Ionicons name="lock-closed-outline" size={16} color={COLORS.red} />}
                  titleStyle={{ color: COLORS.red }}
                  grouped={false}
                />
              </GlassCard>
            </Animated.View>
          )}

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

  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  slotMeta: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: 2,
  },
  slotHint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: TRACKING.label,
  },
  slotBodyHint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

  photoContainer: {
    height: 220,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bg.secondary,
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
    backgroundColor: 'rgba(0,0,0,0.65)',
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
  },

  slotEmpty: {
    height: 140,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
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
    width: 48,
    height: 48,
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

  limitBanner: {
    marginBottom: SPACING.base,
    paddingVertical: SPACING.xs,
    borderColor: COLORS.redBorder,
    backgroundColor: COLORS.redDim,
  },

  cta: {
    marginTop: SPACING.lg,
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
