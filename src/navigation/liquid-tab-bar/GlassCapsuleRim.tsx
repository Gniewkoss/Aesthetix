import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CAPSULE_RIM_EDGE, CAPSULE_RIM_TOP, capsuleRim } from './glassCapsule';

type Props = {
  radius: number;
};

/** Rounded highlight rim — follows capsule clip, no square vertical border lines. */
export function GlassCapsuleRim({ radius }: Props) {
  return (
    <>
      <LinearGradient
        colors={[...CAPSULE_RIM_TOP]}
        locations={[0, 0.45]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[capsuleRim.topSheen, { borderRadius: radius }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[...CAPSULE_RIM_EDGE]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[capsuleRim.edgeFadeLeft, { borderTopLeftRadius: radius, borderBottomLeftRadius: radius }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[...CAPSULE_RIM_EDGE]}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
        style={[capsuleRim.edgeFadeRight, { borderTopRightRadius: radius, borderBottomRightRadius: radius }]}
        pointerEvents="none"
      />
    </>
  );
}
