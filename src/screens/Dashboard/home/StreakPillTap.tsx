import React, { useCallback, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, T, HEADER_PILL } from '../../../theme/obsidian';
import { DUO_BOUNCE, DUO_SETTLE, DUO_WIGGLE_MS } from '../../../motion/duolingo';
import { StreakEmberBurst } from '../../../components/celebration/StreakEmberBurst';

type Props = {
  streak: number;
  reduceMotion: boolean;
};

/** Header streak — tap: icon bounce + embers only (no glow box). */
export function StreakPillTap({ streak, reduceMotion }: Props) {
  const [burstId, setBurstId] = useState(0);
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const flash = useSharedValue(0);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  const onPress = useCallback(() => {
    if (!reduceMotion) {
      setBurstId((n) => n + 1);
      iconScale.value = withSequence(
        withSpring(1.35, DUO_BOUNCE),
        withSpring(1, DUO_SETTLE),
      );
      iconRotate.value = withSequence(
        withTiming(-10, { duration: DUO_WIGGLE_MS }),
        withTiming(8, { duration: DUO_WIGGLE_MS }),
        withTiming(0, { duration: DUO_WIGGLE_MS }),
      );
      flash.value = withSequence(
        withTiming(1, { duration: 70 }),
        withTiming(0, { duration: 380 }),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      void Haptics.selectionAsync();
    }
  }, [reduceMotion, iconScale, iconRotate, flash]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${streak} day streak`}
      hitSlop={8}
      android_ripple={{ color: 'transparent', borderless: true }}
    >
      <View style={styles.shell}>
        {!reduceMotion && (
          <View style={styles.emberSlot} pointerEvents="none">
            <StreakEmberBurst burstId={burstId} color={C.warning} />
          </View>
        )}

        <View style={styles.pill}>
          {!reduceMotion && (
            <View style={styles.flashClip} pointerEvents="none">
              <Animated.View style={[styles.flash, flashStyle]} />
            </View>
          )}
          <Animated.View style={iconStyle}>
            <Ionicons name="flame" size={13} color={C.warning} />
          </Animated.View>
          <Text style={[T.overline, { color: C.warning }]}>{streak}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    alignSelf: 'flex-start',
    overflow: 'visible',
  },
  emberSlot: {
    position: 'absolute',
    left: 12,
    top: '50%',
    width: 14,
    height: 14,
    marginTop: -7,
    zIndex: 3,
    overflow: 'visible',
  },
  pill: {
    ...HEADER_PILL,
    borderWidth: 1,
    borderColor: 'rgba(244,183,64,0.35)',
    backgroundColor: C.surface2,
    position: 'relative',
    zIndex: 1,
  },
  flashClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: 'hidden',
    zIndex: 0,
  },
  flash: {
    flex: 1,
    backgroundColor: 'rgba(244,183,64,0.28)',
  },
});
