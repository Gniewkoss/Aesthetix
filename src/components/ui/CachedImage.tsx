import React from 'react';
import { Image, type ImageProps } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

type Props = Omit<ImageProps, 'source'> & {
  uri: string;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/** Disk-cached remote/local image (expo-image). */
export function CachedImage({ uri, style, accessibilityLabel, contentFit = 'cover', ...rest }: Props) {
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={200}
      accessibilityLabel={accessibilityLabel}
      {...rest}
    />
  );
}
