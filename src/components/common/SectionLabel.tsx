import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONTS, SPACING, TRACKING } from '../../theme';

// ─── SectionLabel ──────────────────────────────────────────────────────────────
//
// Two tiers:
//   tier="eyebrow"  → 10px all-caps muted label above a section (e.g. "LATEST SCAN")
//   tier="title"    → 15px bold section heading within a screen (e.g. "Score Breakdown")
//
// Both include consistent top/bottom margin. Pass noTopMargin for first section.

interface SectionLabelProps {
  label: string;
  tier?: 'eyebrow' | 'title';
  noTopMargin?: boolean;
  /** Use inside a row with an icon — skips outer margins so alignment stays even */
  inline?: boolean;
  color?: string;
}

export function SectionLabel({
  label,
  tier = 'eyebrow',
  noTopMargin = false,
  inline = false,
  color,
}: SectionLabelProps) {
  if (tier === 'title') {
    return (
      <View
        style={[
          inline ? styles.titleInlineWrap : styles.titleWrap,
          noTopMargin && !inline && styles.noTopMargin,
        ]}
      >
        <Text style={[styles.title, color ? { color } : null]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.eyebrowWrap, noTopMargin && styles.noTopMargin]}>
      <Text style={[styles.eyebrow, color ? { color } : null]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrowWrap: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  eyebrow: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.caps,
  },

  titleWrap: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  titleInlineWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.heading,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.label,
  },

  noTopMargin: {
    marginTop: 0,
  },
});
