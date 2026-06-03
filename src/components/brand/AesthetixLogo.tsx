import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const LOCKUP_SOURCE = require('../../../assets/logos/aesthetix-logo.png');
const MARK_SOURCE = require('../../../assets/logos/aesthetix-mark.png');

/** Trimmed lockup @3× (1962×348) — transparent, tight crop */
const LOCKUP_ASPECT = 1962 / 348;

/** Sygnet crop @3× (435×348) */
const MARK_ASPECT = 435 / 348;

type Variant = 'mark' | 'wordmark';

interface AesthetixLogoProps {
  variant: Variant;
  width: number;
  /** Ignored for wordmark (aspect ratio is fixed). */
  height?: number;
  /** @deprecated Logo is a fixed white PNG with transparent background */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function AesthetixLogo({
  variant,
  width,
  height,
  style,
}: AesthetixLogoProps) {
  if (variant === 'mark') {
    const w = width;
    const h = height ?? width / MARK_ASPECT;
    return (
      <View style={[styles.lockupWrap, style]}>
        <Image
          source={MARK_SOURCE}
          style={{ width: w, height: h }}
          contentFit="contain"
          cachePolicy="memory-disk"
          accessibilityRole="image"
          accessibilityLabel="Aesthetix"
        />
      </View>
    );
  }

  const h = height ?? width / LOCKUP_ASPECT;
  return (
    <View style={[styles.lockupWrap, style]}>
        <Image
          source={LOCKUP_SOURCE}
          style={{ width, height: h }}
          contentFit="contain"
          cachePolicy="memory-disk"
          accessibilityRole="image"
          accessibilityLabel="Aesthetix"
        />
    </View>
  );
}

const styles = StyleSheet.create({
  lockupWrap: {
    alignItems: 'center',
    alignSelf: 'center',
  },
});
