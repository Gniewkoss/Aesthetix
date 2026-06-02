import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CachedImage } from '../../../components/ui/CachedImage';
import { C, T, R, S } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';
import { PoseFigureGuide } from './PoseFigureGuide';

type Pose = 'front' | 'side' | 'back';

interface PoseChipProps {
  pose: Pose;
  label: string;
  uri?: string;
  active: boolean;
  onPress: () => void;
}

export function PoseChip({ pose, label, uri, active, onPress }: PoseChipProps) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${label} pose${uri ? ', captured' : ''}`} style={styles.wrap}>
      <View style={[styles.thumb, active && styles.thumbActive, active && uri ? null : null]}>
        {uri ? (
          <CachedImage uri={uri} style={StyleSheet.absoluteFill} accessibilityLabel={`${label} thumbnail`} />
        ) : (
          <View style={styles.placeholder}>
            <PoseFigureGuide pose={pose} width={40} opacity={active ? 1 : 0.55} />
          </View>
        )}
        {uri && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={11} color={C.voltInk} />
          </View>
        )}
      </View>
      <Text style={[T.caption, { color: active ? C.volt : C.text3, marginTop: 5 }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  thumb: {
    width: '100%',
    aspectRatio: 0.84,
    borderRadius: R.md,
    overflow: 'hidden',
    backgroundColor: C.surface2,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  thumbActive: { borderColor: C.volt },
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  check: {
    position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.volt, alignItems: 'center', justifyContent: 'center',
  },
});
