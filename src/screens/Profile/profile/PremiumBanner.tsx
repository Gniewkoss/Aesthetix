import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T, R, S, LAYOUT, E } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';

const textAndroid = Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : null;

/** Volt-accented upgrade prompt → Subscription. */
export function PremiumBanner({ onPress }: { onPress: () => void }) {
  return (
    <View style={[styles.glowShell, Platform.OS === 'ios' ? E.glow : styles.glowAndroid]}>
      <PressableScale
        scaleTo={0.985}
        onPress={onPress}
        accessibilityLabel="Upgrade to Premium"
        android_ripple={{ color: 'rgba(199,249,64,0.18)' }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="flash" size={18} color={C.voltInk} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, textAndroid]}>Upgrade to Premium</Text>
          <Text style={[styles.subtitle, textAndroid]}>Unlimited scans · AI coach · Full reports</Text>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="arrow-forward" size={16} color={C.volt} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  glowShell: {
    borderRadius: R.xl,
  },
  glowAndroid: {
    elevation: 0,
    shadowOpacity: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
    borderRadius: R.xl,
    overflow: 'hidden',
    paddingVertical: S.base,
    paddingLeft: LAYOUT.cardPad,
    paddingRight: S.lg,
    elevation: 0,
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
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    ...T.cardTitle,
    color: C.text,
    fontSize: 16,
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  subtitle: {
    ...T.caption,
    color: C.text2,
    marginTop: 2,
    lineHeight: 18,
    backgroundColor: 'transparent',
  },
  chevron: {
    flexShrink: 0,
    paddingLeft: S.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
