import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';

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

const CONTAINER = { width: 168, height: 200 };

function getLayouts(count: number): LayoutSpec[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ width: 112, height: 148, left: 28, top: 26, rotate: '0deg', zIndex: 1 }];
  }
  if (count === 2) {
    return [
      { width: 96, height: 128, left: 8, top: 38, rotate: '-9deg', zIndex: 1 },
      { width: 96, height: 128, left: 64, top: 30, rotate: '8deg', zIndex: 2 },
    ];
  }
  return [
    { width: 88, height: 116, left: 4, top: 52, rotate: '-12deg', zIndex: 1 },
    { width: 92, height: 122, left: 38, top: 28, rotate: '4deg', zIndex: 3 },
    { width: 84, height: 110, left: 78, top: 48, rotate: '11deg', zIndex: 2 },
  ];
}

function FloatingPhoto({
  uri,
  layout,
  floatOffset,
}: {
  uri: string;
  layout: LayoutSpec;
  floatOffset: number;
}) {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400 + floatOffset, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400 + floatOffset, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [float, floatOffset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (float.value - 0.5) * 8 },
      { rotate: layout.rotate },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.photoCard,
        {
          width: layout.width,
          height: layout.height,
          left: layout.left,
          top: layout.top,
          zIndex: layout.zIndex,
        },
        animatedStyle,
        SHADOWS.md,
      ]}
    >
      <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
      <View style={styles.photoShine} />
    </Animated.View>
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
        <FloatingPhoto
          key={`${uri}-${i}`}
          uri={uri}
          layout={layouts[i]}
          floatOffset={i * 280}
        />
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
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: COLORS.bg.card,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoShine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
});
