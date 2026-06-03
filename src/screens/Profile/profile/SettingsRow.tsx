import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  badge?: string;
  danger?: boolean;
  neutralIcon?: boolean;
  showChevron?: boolean;
  showBorder?: boolean;
  onPress: () => void;
}

/** Grouped-list row: leading icon tile + title + optional badge + chevron. */
export function SettingsRow({
  icon, iconColor = C.text2, title, badge, danger = false, neutralIcon = false,
  showChevron = true, showBorder = false, onPress,
}: SettingsRowProps) {
  const color = danger ? C.danger : iconColor;
  const textColor = danger ? C.danger : C.text;
  const iconTileStyle = neutralIcon
    ? { backgroundColor: C.surface2, borderColor: C.border }
    : { backgroundColor: color + '1A', borderColor: color + '30' };

  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [showBorder && styles.border, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, iconTileStyle]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[T.body, styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text>

        {badge ? (
          <View style={styles.badge}>
            <Text style={[T.overline, { color: C.voltInk }]}>{badge}</Text>
          </View>
        ) : null}

        {showChevron && !danger ? <Ionicons name="chevron-forward" size={16} color={C.text3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  pressed: { backgroundColor: C.surface2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: 14,
    paddingHorizontal: LAYOUT.cardPad,
  },
  title: { flex: 1, fontSize: 15 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badge: {
    backgroundColor: C.volt,
    borderRadius: R.xs,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
});
