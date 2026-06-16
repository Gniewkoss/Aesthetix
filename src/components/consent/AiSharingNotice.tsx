import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AI_SHARING_NOTICE_SHORT, PRIVACY_URL } from '../../constants/legal';
import { C, T } from '../../theme/obsidian';

interface Props {
  onLearnMore?: () => void;
}

export function AiSharingNotice({ onLearnMore }: Props) {
  return (
    <View style={styles.root}>
      <Ionicons name="information-circle-outline" size={13} color={C.text3} />
      <Text style={styles.text}>
        {AI_SHARING_NOTICE_SHORT}{' '}
        <Text
          style={styles.link}
          onPress={onLearnMore ?? (() => { void Linking.openURL(PRIVACY_URL).catch(() => {}); })}
        >
          Learn more
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  text: {
    ...T.caption,
    color: C.text3,
    flex: 1,
    textAlign: 'center',
    lineHeight: 16,
  },
  link: {
    color: C.volt,
    fontFamily: 'Manrope_600SemiBold',
  },
});
