import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../../theme';
import { APP_BRAND } from './constants';

export function AnalysisBrandHeader() {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="scan" size={22} color={COLORS.accent} />
      </View>
      <Text style={styles.name}>{APP_BRAND.name}</Text>
      <Text style={styles.tagline}>{APP_BRAND.tagline}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONTS.sizes['2xl'],
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.disabled,
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
