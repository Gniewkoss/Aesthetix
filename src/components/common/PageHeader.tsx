import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, FONT_FAMILY, FONTS, LAYOUT, RADIUS, SPACING, TRACKING,
} from '../../theme';

const BACK_BTN_SIZE = LAYOUT.minTouchTarget;

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
  showDivider?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  variant = 'push',
  onBack,
  rightComponent,
  leftComponent,
  noTopPad,
  showDivider,
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const isTab = variant === 'tab';

  const resolvedNoTopPad = noTopPad ?? isTab;
  const resolvedShowDivider = showDivider ?? !isTab;

  const topPad = resolvedNoTopPad ? 0 : insets.top + SPACING.sm;

  if (isTab) {
    const hasAccessoryRow = Boolean(leftComponent || rightComponent);

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.tabHeader,
          { paddingTop: topPad },
          resolvedShowDivider && styles.divider,
        ]}
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
    <View
      style={[
        styles.pushHeader,
        { paddingTop: topPad },
        resolvedShowDivider && styles.divider,
      ]}
    >
      <View style={styles.pushRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.text.primary} />
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
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.hairline,
  },

  // ── Tab variant ──────────────────────────────────────────────────────────────
  tabHeader: {
    paddingHorizontal: LAYOUT.pagePad,
    paddingBottom: SPACING.lg,
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
    fontSize: FONTS.sizes['3xl'],
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
    paddingHorizontal: LAYOUT.pagePad,
    paddingBottom: SPACING.base,
    backgroundColor: 'transparent',
  },
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: BACK_BTN_SIZE,
    height: BACK_BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border.default,
    flexShrink: 0,
  },
  backPlaceholder: {
    width: BACK_BTN_SIZE,
    flexShrink: 0,
  },
  pushCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    gap: 2,
  },
  pushTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.heading,
  },
  pushSubtitle: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
  },
  pushRight: {
    width: BACK_BTN_SIZE,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
});
