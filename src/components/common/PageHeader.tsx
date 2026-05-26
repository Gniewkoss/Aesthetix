import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING, TRACKING } from '../../theme';

// Two modes:
//   variant="tab"  → large left-aligned title (Home, Progress, etc.)
//   variant="push" → centered title + back button (Dashboard, Upload, etc.)

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'tab' | 'push';
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  noTopPad?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  variant = 'push',
  onBack,
  rightComponent,
  leftComponent,
  noTopPad = variant === 'tab',
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPad = noTopPad ? 0 : insets.top + SPACING.sm;

  if (variant === 'tab') {
    const hasAccessoryRow = Boolean(leftComponent || rightComponent);

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.tabHeader, { paddingTop: topPad }]}
      >
        {hasAccessoryRow ? (
          <>
            <View style={styles.tabAccessoryRow}>
              {leftComponent ? (
                <View style={styles.tabLeft}>{leftComponent}</View>
              ) : (
                <View style={styles.tabLeftSpacer} />
              )}
              {rightComponent ? (
                <View style={styles.tabRight}>{rightComponent}</View>
              ) : null}
            </View>
            <View style={styles.tabTitleBlock}>
              <Text style={styles.tabTitle}>{title}</Text>
              {subtitle ? <Text style={styles.tabSubtitle}>{subtitle}</Text> : null}
            </View>
          </>
        ) : (
          <View style={styles.tabRow}>
            <View style={styles.tabTitleBlock}>
              <Text style={styles.tabTitle}>{title}</Text>
              {subtitle ? <Text style={styles.tabSubtitle}>{subtitle}</Text> : null}
            </View>
            {rightComponent ? (
              <View style={styles.tabRight}>{rightComponent}</View>
            ) : null}
          </View>
        )}
      </Animated.View>
    );
  }

  // variant === 'push'
  return (
    <View style={[styles.pushHeader, { paddingTop: topPad }]}>
      <View style={styles.pushRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.pushCenter}>
          <Text style={styles.pushTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.pushSubtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.pushRight}>
          {rightComponent ?? null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Tab variant ─────────────────────────────────────────────────────────────
  tabHeader: {
    paddingHorizontal: SPACING.xl,   // 24 — matches new pagePad
    paddingBottom: SPACING.lg,       // 20
    gap: SPACING.sm,
  },
  tabAccessoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabLeft: {
    flexShrink: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  tabLeftSpacer: { flex: 1 },
  tabTitleBlock: {
    gap: 2,
    minWidth: 0,
  },
  tabTitle: {
    fontSize: FONTS.sizes['3xl'],    // 34 — strong hierarchy
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
  },
  tabSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },
  tabRight: { flexShrink: 0 },

  // ── Push variant ─────────────────────────────────────────────────────────────
  pushHeader: {
    paddingHorizontal: SPACING.xl,   // 24
    paddingBottom: SPACING.lg,       // 20
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.hairline,
  },
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Minimal back button — icon only, solid bg (not glass)
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border.subtle,
    flexShrink: 0,
  },
  backPlaceholder: {
    width: 36,
    flexShrink: 0,
  },
  pushCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  pushTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.md,          // 17 — readable, authoritative
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.heading,   // -0.6 — tight but legible
  },
  pushSubtitle: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  pushRight: {
    width: 36,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
});
