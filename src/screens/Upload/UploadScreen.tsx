import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/ui/GradientButton';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

type PhotoSlot = 'front' | 'side' | 'back';

const SLOTS: { key: PhotoSlot; label: string; icon: string; hint: string }[] = [
  { key: 'front', label: 'Front View', icon: '👤', hint: 'Stand facing camera, arms at sides' },
  { key: 'side', label: 'Side View', icon: '🔄', hint: 'Stand sideways, neutral posture' },
  { key: 'back', label: 'Back View', icon: '↩️', hint: 'Stand with back to camera, arms at sides' },
];

export function UploadScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, string>>>({});
  const { user } = useAuthStore();

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
    navigation.navigate('AnalysisLoading', { imageUris: uris });
  };

  const photoCount = Object.keys(photos).length;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['rgba(123,47,190,0.12)', 'transparent']} style={styles.orb} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          title="Scan Physique"
          subtitle="Add 1–3 photos for best results"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Tips banner */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.tipsBanner}>
            <Ionicons name="information-circle" size={18} color={COLORS.cyan} />
            <Text style={styles.tipsText}>
              Wear minimal clothing for accurate analysis. Good lighting = better results.
            </Text>
          </Animated.View>

          {/* Photo slots */}
          {SLOTS.map((slot, i) => (
            <Animated.View key={slot.key} entering={FadeInDown.delay(i * 100).duration(500)} style={styles.slotWrapper}>
              <Text style={styles.slotLabel}>{slot.icon} {slot.label}</Text>
              <Text style={styles.slotHint}>{slot.hint}</Text>

              {photos[slot.key] ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photos[slot.key] }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => setPhotos((prev) => { const n = { ...prev }; delete n[slot.key]; return n; })}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.pink} />
                  </TouchableOpacity>
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.photoOverlay} />
                  <Text style={styles.photoLabel}>✓ {slot.label}</Text>
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <View style={styles.emptyButtons}>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => takePhoto(slot.key)}>
                      <Ionicons name="camera" size={22} color={COLORS.cyan} />
                      <Text style={styles.emptyBtnText}>Camera</Text>
                    </TouchableOpacity>
                    <View style={styles.emptyDivider} />
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => pickPhoto(slot.key)}>
                      <Ionicons name="images" size={22} color={COLORS.purple} />
                      <Text style={[styles.emptyBtnText, { color: COLORS.purple }]}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>
          ))}

          {/* Scan limit warning */}
          {!canScan && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.limitBanner}>
              <Text style={styles.limitText}>🔒 Daily scan limit reached — upgrade to Premium for unlimited scans</Text>
            </Animated.View>
          )}

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ marginTop: SPACING.xl, marginBottom: SPACING['2xl'] }}>
            <GradientButton
              title={!canScan ? '🔒 Upgrade to Scan' : photoCount === 0 ? 'Add Photos to Analyze' : `Analyze ${photoCount} Photo${photoCount > 1 ? 's' : ''} →`}
              onPress={handleAnalyze}
              variant={!canScan ? 'secondary' : 'primary'}
              size="lg"
              disabled={photoCount === 0}
            />
            <Text style={styles.privacyNote}>🔒 Photos are analyzed securely and never stored</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, top: -100, right: -100 },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
  tipsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cyanDim,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  tipsText: { flex: 1, color: COLORS.cyan, fontSize: FONTS.sizes.sm, lineHeight: FONTS.sizes.sm * 1.5 },
  slotWrapper: { marginBottom: SPACING.xl },
  slotLabel: { color: COLORS.text.primary, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, marginBottom: 2 },
  slotHint: { color: COLORS.text.muted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.md },
  photoContainer: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  photoLabel: {
    position: 'absolute', bottom: 12, left: 14,
    color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm,
  },
  emptySlot: {
    height: 150,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  emptyButtons: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  emptyBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyBtnText: { color: COLORS.cyan, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  emptyDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.08)' },
  limitBanner: {
    backgroundColor: COLORS.pinkDim,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pinkBorder,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  limitText: { color: COLORS.pink, fontSize: FONTS.sizes.sm, textAlign: 'center' },
  privacyNote: { color: COLORS.text.disabled, fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: SPACING.sm },
});
