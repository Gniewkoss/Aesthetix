import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, T, R, S } from '../../../theme/obsidian';
import { SPRING_UI } from '../../../motion';

export interface SegOption {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegOption[];
  value: string;
  onChange: (key: string) => void;
  reduceMotion: boolean;
}

/** Sliding-pill segmented control. The active pill springs between segments. */
export function SegmentedControl({ options, value, onChange, reduceMotion }: SegmentedControlProps) {
  const [trackW, setTrackW] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const segW = trackW > 0 ? (trackW - PADDING * 2) / options.length : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    const target = PADDING + index * segW;
    x.value = reduceMotion ? withTiming(target, { duration: 0 }) : withSpring(target, SPRING_UI);
  }, [index, segW, reduceMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: segW,
  }));

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={onLayout}>
      {segW > 0 && <Animated.View style={[styles.pill, pillStyle]} />}
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              if (o.key === value) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(o.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            style={styles.segment}
          >
            <Text style={[T.label, { color: active ? C.text : C.text3 }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const PADDING = 3;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: C.surface2,
    borderRadius: R.pill,
    padding: PADDING,
    borderWidth: 1,
    borderColor: C.border,
  },
  pill: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: 0,
    backgroundColor: C.surface3,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.borderMd,
  },
  segment: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.sm,
  },
});
