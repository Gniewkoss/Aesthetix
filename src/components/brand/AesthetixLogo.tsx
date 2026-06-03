import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const LOGO_SOURCE = require('../../../assets/logos/aesthetix-logo.png');

/** Full lockup (sygnet + wordmark), 1024×796 source */
const LOCKUP_ASPECT = 1024 / 796;

/** Approximate width share of the sygnet in the lockup image */
const MARK_WIDTH_RATIO = 0.34;

type Variant = 'mark' | 'wordmark';

interface AesthetixLogoProps {
  variant: Variant;
  width: number;
  /** Ignored for wordmark (aspect ratio is fixed). */
  height?: number;
  /** @deprecated PNG logo is fixed white-on-black; kept for call-site compatibility */
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
    const size = height ?? width;
    const imageWidth = size / MARK_WIDTH_RATIO;
    return (
      <View
        style={[{ width: size, height: size, overflow: 'hidden' }, style]}
        accessibilityRole="image"
        accessibilityLabel="Aesthetix"
      >
        <Image
          source={LOGO_SOURCE}
          style={{ width: imageWidth, height: size }}
          contentFit="contain"
          contentPosition="left"
        />
      </View>
    );
  }

  const h = height ?? width / LOCKUP_ASPECT;
  return (
    <View style={style}>
      <Image
        source={LOGO_SOURCE}
        style={{ width, height: h }}
        contentFit="contain"
        accessibilityRole="image"
        accessibilityLabel="Aesthetix"
      />
    </View>
  );
}
