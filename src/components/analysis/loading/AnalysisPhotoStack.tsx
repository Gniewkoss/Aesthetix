import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS } from '../../../theme';

interface AnalysisPhotoStackProps {
  imageUris: string[];
}

type LayoutSpec = {
  width: number;
  height: number;
  left: number;
  top: number;
  rotate: string;
  zIndex: number;
};

const CONTAINER = { width: 148, height: 168 };

function getLayouts(count: number): LayoutSpec[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ width: 100, height: 132, left: 24, top: 18, rotate: '0deg', zIndex: 1 }];
  }
  if (count === 2) {
    return [
      { width: 86, height: 114, left: 10, top: 32, rotate: '-6deg', zIndex: 1 },
      { width: 86, height: 114, left: 52, top: 26, rotate: '6deg', zIndex: 2 },
    ];
  }
  return [
    { width: 78, height: 104, left: 6, top: 44, rotate: '-8deg', zIndex: 1 },
    { width: 82, height: 108, left: 34, top: 24, rotate: '2deg', zIndex: 3 },
    { width: 74, height: 98, left: 68, top: 40, rotate: '8deg', zIndex: 2 },
  ];
}

function PhotoCard({ uri, layout }: { uri: string; layout: LayoutSpec }) {
  return (
    <View
      style={[
        styles.photoCard,
        {
          width: layout.width,
          height: layout.height,
          left: layout.left,
          top: layout.top,
          zIndex: layout.zIndex,
          transform: [{ rotate: layout.rotate }],
        },
      ]}
    >
      <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
    </View>
  );
}

export function AnalysisPhotoStack({ imageUris }: AnalysisPhotoStackProps) {
  const uris = imageUris.slice(0, 3);
  const layouts = getLayouts(uris.length);

  if (uris.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {uris.map((uri, i) => (
        <PhotoCard key={`${uri}-${i}`} uri={uri} layout={layouts[i]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CONTAINER.width,
    height: CONTAINER.height,
    alignSelf: 'center',
  },
  photoCard: {
    position: 'absolute',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.bg.card,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});
