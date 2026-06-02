import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';

/** Volt-accented upgrade prompt → Subscription. */
export function PremiumBanner({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale
      scaleTo={0.985}
      onPress={onPress}
      accessibilityLabel="Upgrade to Premium"
      style={[styles.card, E.glow]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="flash" size={18} color={C.voltInk} />
      </View>
      <View style={styles.body}>
        <Text style={[T.cardTitle, { color: C.text, fontSize: 16 }]}>Upgrade to Premium</Text>
        <Text style={[T.caption, { color: C.text2, marginTop: 2 }]}>Unlimited scans · AI coach · Full reports</Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={C.volt} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
    borderRadius: R.xl,
    padding: LAYOUT.cardPad,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: R.md,
    backgroundColor: C.volt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
});
