import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_FAMILY, FONTS, RADIUS } from '../../theme';

// ─── Avatar — shadcn/ui Avatar adapted to React Native ───────────────────────
// Supports: image source, fallback initials, size variants, gradient ring border

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  fallback?: string;           // initials, e.g. "JD"
  size?: AvatarSize;
  ringColors?: readonly [string, string];  // gradient ring border colors
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, { container: number; ring: number; fontSize: number; radius: number }> = {
  xs: { container: 32,  ring: 2, fontSize: FONTS.sizes.sm,   radius: RADIUS.sm   },
  sm: { container: 44,  ring: 2, fontSize: FONTS.sizes.base,  radius: RADIUS.md   },
  md: { container: 56,  ring: 2, fontSize: FONTS.sizes.lg,    radius: RADIUS.lg   },
  lg: { container: 72,  ring: 3, fontSize: FONTS.sizes.xl,    radius: RADIUS.xl   },
  xl: { container: 88,  ring: 3, fontSize: FONTS.sizes['2xl'], radius: RADIUS['2xl'] },
};

export function Avatar({ src, fallback, size = 'md', ringColors, style }: AvatarProps) {
  const sz = SIZE_MAP[size];
  const outerSize = sz.container + sz.ring * 2 + 4;

  if (ringColors) {
    return (
      <View
        style={[
          styles.ringWrap,
          { width: outerSize, height: outerSize, borderRadius: sz.radius + 4 },
          style,
        ]}
      >
        <LinearGradient
          colors={ringColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ring,
            { borderRadius: sz.radius + 2, padding: sz.ring },
          ]}
        >
          <AvatarInner src={src} fallback={fallback} sz={sz} />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.plain,
        { width: sz.container, height: sz.container, borderRadius: sz.radius },
        style,
      ]}
    >
      <AvatarInner src={src} fallback={fallback} sz={sz} />
    </View>
  );
}

function AvatarInner({
  src,
  fallback,
  sz,
}: {
  src?: string;
  fallback?: string;
  sz: (typeof SIZE_MAP)[AvatarSize];
}) {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[
          styles.image,
          { borderRadius: sz.radius },
        ]}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={['#1D4ED8', '#3B82F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fallback, { borderRadius: sz.radius }]}
    >
      <Text style={[styles.fallbackText, { fontSize: sz.fontSize }]}>
        {(fallback ?? '?').slice(0, 2).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plain: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: FONT_FAMILY.display,
    color: '#ffffff',
  },
});
