import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../../../theme';
import {
  ANALYSIS_HEADLINE,
  ANALYSIS_SUBTEXTS,
  SUBTEXT_ROTATE_MS,
  resolveStepLabel,
} from './constants';

interface AnalysisStepCarouselProps {
  backendStep: string;
  complete?: boolean;
}

export function AnalysisStepCarousel({ backendStep, complete = false }: AnalysisStepCarouselProps) {
  const [rotateIndex, setRotateIndex] = useState(0);

  useEffect(() => {
    if (complete) return;
    const id = setInterval(() => {
      setRotateIndex((i) => (i + 1) % ANALYSIS_SUBTEXTS.length);
    }, SUBTEXT_ROTATE_MS);
    return () => clearInterval(id);
  }, [complete]);

  const subtext = complete
    ? 'Preparing your results'
    : resolveStepLabel(backendStep, rotateIndex);

  return (
    <View style={styles.wrap}>
      <View style={styles.statusCard}>
        <Text style={styles.headline}>
          {complete ? 'Analysis complete' : ANALYSIS_HEADLINE}
        </Text>

        <View style={styles.subtextSlot}>
          <Animated.Text
            key={subtext}
            entering={FadeIn.duration(350)}
            exiting={FadeOut.duration(250)}
            style={styles.subtext}
          >
            {subtext}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: SPACING.base,
  },
  statusCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  headline: {
    fontFamily: FONT_FAMILY.bodySemibold,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtextSlot: {
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtext: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
});
