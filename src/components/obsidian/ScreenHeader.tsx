import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, T, R, S, LAYOUT } from '../../theme/obsidian';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
}

const SIDE_SLOT = 44;

/** Push-screen header: back button + title on one row, optional subtitle below. */
export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + S.base }]}>
      <View style={styles.bar}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onBack(); }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: C.surface3 }]}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </Pressable>

        <View style={styles.titleSlot} pointerEvents="none">
          <Text style={[T.cardTitle, styles.title, { color: C.text }]} numberOfLines={1}>{title}</Text>
        </View>

        <View style={styles.right}>{right ?? <View style={styles.rightSpacer} />}</View>
      </View>

      {subtitle ? (
        <Text style={[T.caption, styles.subtitle, { color: C.text3 }]} numberOfLines={1}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: S.md,
  },
  bar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: SIDE_SLOT,
  },
  titleSlot: {
    position: 'absolute',
    left: -LAYOUT.screenX,
    right: -LAYOUT.screenX,
    height: SIDE_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX + SIDE_SLOT + S.md,
  },
  title: { textAlign: 'center', width: '100%' },
  subtitle: {
    textAlign: 'center',
    marginTop: S.xs,
    marginHorizontal: -LAYOUT.screenX,
    paddingHorizontal: LAYOUT.screenX + SIDE_SLOT + S.md,
  },
  backBtn: {
    width: SIDE_SLOT,
    height: SIDE_SLOT,
    borderRadius: R.pill,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  right: {
    minWidth: SIDE_SLOT,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  rightSpacer: { width: SIDE_SLOT },
});
