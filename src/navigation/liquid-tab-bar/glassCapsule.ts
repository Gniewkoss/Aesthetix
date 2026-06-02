import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import { BAR_GLASS_BORDER } from './constants';

/** True pill radius — avoids square border artifacts from `borderRadius: 999`. */
export function capsuleClip(radius: number): ViewStyle {
  return {
    borderRadius: radius,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  };
}

/** Soft rim clipped to capsule — no rectangular `borderWidth` stroke. */
export const capsuleRim = StyleSheet.create({
  topSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  edgeFadeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 14,
    opacity: 0.35,
  },
  edgeFadeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 14,
    opacity: 0.35,
  },
});

export const CAPSULE_RIM_TOP = ['rgba(255,255,255,0.14)', 'transparent'] as const;
export const CAPSULE_RIM_EDGE = [BAR_GLASS_BORDER, 'transparent'] as const;
