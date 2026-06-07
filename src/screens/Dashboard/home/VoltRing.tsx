import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { CachedImage } from '../../../components/ui/CachedImage';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { TIMING_FILL } from '../../../motion';
import { C } from '../../../theme/obsidian';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface VoltRingProps {
  /** 0–100 */
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  instant?: boolean;
  children?: React.ReactNode;
}

/** Scan photo inside the ring, or the default flash icon. */
export function VoltRingCenter({ photoUri, accentColor }: { photoUri?: string; accentColor: string }) {
  if (photoUri) {
    return (
      <CachedImage
        uri={photoUri}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityLabel="Analyzed scan photo"
      />
    );
  }
  return <Ionicons name="flash" size={20} color={accentColor} />;
}

/**
 * The signature progress ring. Sweeps from 0 → score on mount (or sets the
 * final value instantly under reduced motion). Centre slot via `children`.
 */
export function VoltRing({
  score,
  size = 96,
  strokeWidth = 7,
  color = C.volt,
  trackColor = 'rgba(255,255,255,0.07)',
  instant = false,
  children,
}: VoltRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(1, score / 100));

  const progress = useSharedValue(instant ? target : 0);

  useEffect(() => {
    progress.value = instant ? target : withTiming(target, TIMING_FILL);
  }, [target, instant]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const innerSize = size - strokeWidth * 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View
        style={[
          styles.centerSlot,
          {
            left: strokeWidth,
            top: strokeWidth,
            width: innerSize,
            height: innerSize,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 9999,
  },
});
