import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CachedImage } from '../../../components/ui/CachedImage';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';

interface PhotoSlotCardProps {
  label: string;
  hint: string;
  hintColor: string;
  bodyHint: string;
  uri?: string;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
}

export function PhotoSlotCard({
  label, hint, hintColor, bodyHint, uri, onCamera, onGallery, onRemove,
}: PhotoSlotCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[T.cardTitle, { color: C.text, fontSize: 16 }]}>{label}</Text>
        <View style={[styles.hintPill, { backgroundColor: hintColor + '1A', borderColor: hintColor + '40' }]}>
          <Text style={[T.overline, { color: hintColor }]}>{hint.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[T.caption, { color: C.text3, marginTop: 2 }]}>{bodyHint}</Text>

      {uri ? (
        <View style={styles.preview}>
          <CachedImage uri={uri} style={styles.photo} accessibilityLabel={`${label} physique photo`} />
          <View style={styles.successBar}>
            <View style={styles.successLeft}>
              <Ionicons name="checkmark-circle" size={14} color={C.success} />
              <Text style={[T.label, { color: '#fff' }]}>{label} added</Text>
            </View>
            <Pressable
              onPress={onRemove}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label} photo`}
              style={styles.removeBtn}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.dropzone}>
          <PressableScale onPress={onCamera} accessibilityLabel={`Take ${label} photo with camera`} style={styles.zone}>
            <View style={[styles.zoneIcon, { backgroundColor: C.voltDim, borderColor: C.voltBorder }]}>
              <Ionicons name="camera-outline" size={22} color={C.volt} />
            </View>
            <Text style={[T.label, { color: C.text }]}>Camera</Text>
          </PressableScale>

          <View style={styles.zoneDivider} />

          <PressableScale onPress={onGallery} accessibilityLabel={`Choose ${label} photo from library`} style={styles.zone}>
            <View style={[styles.zoneIcon, { backgroundColor: C.surface2, borderColor: C.borderMd }]}>
              <Ionicons name="images-outline" size={22} color={C.text2} />
            </View>
            <Text style={[T.label, { color: C.text }]}>Gallery</Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...E.card,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
    marginBottom: LAYOUT.cardGap,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hintPill: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.pill, borderWidth: 1 },

  preview: {
    height: 220,
    marginTop: S.base,
    borderRadius: R.lg,
    overflow: 'hidden',
    backgroundColor: C.surface2,
  },
  photo: { width: '100%', height: '100%' },
  successBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
  },
  successLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: R.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropzone: {
    height: 140,
    marginTop: S.base,
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.borderMd,
    backgroundColor: C.surface2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  zone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm },
  zoneIcon: {
    width: 48,
    height: 48,
    borderRadius: R.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: S.lg, backgroundColor: C.border },
});
