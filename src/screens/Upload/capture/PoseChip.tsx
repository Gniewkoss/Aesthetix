import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CachedImage } from '../../../components/ui/CachedImage';
import { C, T, R, S } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';
import { PoseFigureGuide } from './PoseFigureGuide';

type Pose = 'front' | 'back';

interface PoseChipProps {
  pose: Pose;
  label: string;
  uri?: string;
  active: boolean;
  locked?: boolean;
  onPress: () => void;
}

export function PoseChip({ pose, label, uri, active, locked, onPress }: PoseChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${label} pose${locked ? ', premium only' : ''}${uri ? ', captured' : ''}`}
      style={styles.wrap}
    >
      <View style={[styles.thumb, active && styles.thumbActive, locked && styles.thumbLocked]}>
        {uri ? (
          <CachedImage uri={uri} style={StyleSheet.absoluteFill} accessibilityLabel={`${label} thumbnail`} />
        ) : (
          <View style={styles.placeholder}>
            <PoseFigureGuide pose={pose} width={28} opacity={active ? 1 : 0.55} />
          </View>
        )}
        {locked && (
          <View style={styles.lock}>
            <Ionicons name="lock-closed" size={12} color={C.text} />
          </View>
        )}
        {uri && !locked && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={11} color={C.voltInk} />
          </View>
        )}
      </View>
      <Text style={[T.caption, { color: active ? C.volt : C.text3, marginTop: 4, fontSize: 11 }]}>{label}</Text>
    </PressableScale>
  );
}

/** Compact filmstrip tile — fixed size so two chips don't stretch across the screen. */
export const POSE_CHIP_WIDTH = 68;
export const POSE_CHIP_HEIGHT = 80;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: POSE_CHIP_WIDTH },
  thumb: {
    width: POSE_CHIP_WIDTH,
    height: POSE_CHIP_HEIGHT,
    borderRadius: R.sm,
    overflow: 'hidden',
    backgroundColor: C.surface2,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  thumbActive: { borderColor: C.volt },
  thumbLocked: { opacity: 0.72 },
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  lock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.volt, alignItems: 'center', justifyContent: 'center',
  },
});
