import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CachedImage } from '../../ui/CachedImage';
import { C, R } from '../../../theme/obsidian';

type Variant = 'default' | 'compact';

interface AnalysisPhotoStackProps {
  imageUris: string[];
  variant?: Variant;
  animate?: boolean;
}

type LayoutSpec = {
  width: number;
  height: number;
  left: number;
  top: number;
  rotate: string;
  zIndex: number;
};

const LAYOUTS: Record<Variant, { container: { width: number; height: number }; getLayouts: (n: number) => LayoutSpec[] }> = {
  default: {
    container: { width: 148, height: 168 },
    getLayouts: (count) => {
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
    },
  },
  compact: {
    container: { width: 100, height: 82 },
    getLayouts: (count) => {
      if (count <= 0) return [];
      if (count === 1) {
        const w = 54;
        const h = 68;
        const { width: cw, height: ch } = LAYOUTS.compact.container;
        return [{
          width: w,
          height: h,
          left: Math.round((cw - w) / 2),
          top: Math.round((ch - h) / 2),
          rotate: '0deg',
          zIndex: 1,
        }];
      }
      if (count === 2) {
        return [
          { width: 48, height: 64, left: 10, top: 12, rotate: '-12deg', zIndex: 1 },
          { width: 50, height: 66, left: 38, top: 6, rotate: '8deg', zIndex: 2 },
        ];
      }
      // Shuffle deck: back → front, each card peeks from behind
      return [
        { width: 46, height: 62, left: 4, top: 16, rotate: '-16deg', zIndex: 1 },
        { width: 48, height: 64, left: 22, top: 10, rotate: '-5deg', zIndex: 2 },
        { width: 50, height: 66, left: 42, top: 4, rotate: '11deg', zIndex: 3 },
      ];
    },
  },
};

function PhotoCard({
  uri,
  layout,
  isFront,
  index,
  animate,
}: {
  uri: string;
  layout: LayoutSpec;
  isFront: boolean;
  index: number;
  animate: boolean;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!animate || !isFront) {
      drift.value = 0;
      return;
    }
    drift.value = withDelay(
      index * 120,
      withRepeat(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [animate, isFront, index, drift]);

  const motionStyle = useAnimatedStyle(() => {
    if (!isFront || !animate) return {};
    const nudge = (drift.value - 0.5) * 3;
    return {
      transform: [
        { rotate: layout.rotate },
        { translateX: nudge },
        { translateY: -nudge * 0.5 },
      ],
    };
  });

  const staticTransform = [{ rotate: layout.rotate }];

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(320)}
      style={[
        styles.photoCard,
        isFront && styles.photoCardFront,
        {
          width: layout.width,
          height: layout.height,
          left: layout.left,
          top: layout.top,
          zIndex: layout.zIndex,
        },
        animate && isFront ? motionStyle : { transform: staticTransform },
      ]}
    >
      <CachedImage uri={uri} style={styles.photoImage} accessibilityLabel="Scan photo" />
      <View style={[styles.photoShade, isFront && styles.photoShadeFront]} pointerEvents="none" />
    </Animated.View>
  );
}

export function AnalysisPhotoStack({
  imageUris,
  variant = 'default',
  animate = false,
}: AnalysisPhotoStackProps) {
  const uris = imageUris.slice(0, 3);
  const spec = LAYOUTS[variant];
  const layouts = spec.getLayouts(uris.length);

  if (uris.length === 0) {
    return <View style={[styles.container, spec.container]} />;
  }

  const frontIndex = uris.length - 1;

  return (
    <View style={[styles.container, spec.container]}>
      {uris.map((uri, i) => (
        <PhotoCard
          key={`${uri}-${i}`}
          uri={uri}
          layout={layouts[i]}
          isFront={i === frontIndex}
          index={i}
          animate={animate}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  photoCard: {
    position: 'absolute',
    borderRadius: R.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderMd,
    backgroundColor: C.surface2,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  photoCardFront: {
    borderColor: C.voltBorder,
    shadowColor: C.volt,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 13, 0.35)',
  },
  photoShadeFront: {
    backgroundColor: 'rgba(10, 11, 13, 0.12)',
  },
});
