import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

interface EmptyStateProps {
  iconName: string;
  iconColor: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function EmptyState({ iconName, iconColor, title, subtitle, children }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInDown.delay(80).duration(500)}
        style={[styles.iconRing, { borderColor: iconColor + '40', backgroundColor: iconColor + '0A' }]}>
        <View style={[styles.iconInner, { backgroundColor: iconColor + '14' }]}>
          <Ionicons name={iconName as any} size={26} color={iconColor} />
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(220).duration(450)} style={styles.title}>
        {title}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(320).duration(450)} style={styles.subtitle}>
        {subtitle}
      </Animated.Text>

      {children && (
        <Animated.View entering={FadeInDown.delay(440).duration(400)}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['5xl'],
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING['2xl'],
  },
  iconInner: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    lineHeight: FONTS.sizes.sm * 1.65,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
});
