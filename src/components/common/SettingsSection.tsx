import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { GlassCard } from '../ui/GlassCard';
import { SPACING } from '../../theme';

interface SettingsSectionProps {
  label?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  noTopMargin?: boolean;
  /** Pass false when children manage their own card */
  wrapInCard?: boolean;
}

/** iOS Settings-style section: optional eyebrow label + grouped card */
export function SettingsSection({
  label,
  children,
  style,
  noTopMargin = false,
  wrapInCard = true,
}: SettingsSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {label ? (
        <SectionLabel label={label} tier="eyebrow" noTopMargin={noTopMargin} />
      ) : null}
      {wrapInCard ? (
        <GlassCard padding={0}>{children}</GlassCard>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
});
