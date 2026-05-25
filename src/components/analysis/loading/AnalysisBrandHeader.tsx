import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AesthetixLogo } from '../../brand/AesthetixLogo';
import { COLORS, FONT_FAMILY, FONTS, SPACING, TRACKING } from '../../../theme';
import { APP_BRAND } from './constants';

interface AnalysisBrandHeaderProps {
  topInset: number;
}

export function AnalysisBrandHeader({ topInset }: AnalysisBrandHeaderProps) {
  const rowOpacity = useSharedValue(0.85);

  useEffect(() => {
    rowOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0,  { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.72, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: rowOpacity.value }));

  return (
    <View style={[styles.wrap, { paddingTop: topInset + SPACING.lg }]}>
      <Animated.View style={[styles.logoRow, fadeStyle]}>
        <AesthetixLogo variant="mark" width={22} height={22} color={COLORS.cream} />
        <AesthetixLogo variant="wordmark" width={110} color={COLORS.cream} />
      </Animated.View>
      <Text style={styles.tagline}>{APP_BRAND.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tagline: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.label,
  },
});
