import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../../../types';
import { C, T, R, S } from '../../../theme/obsidian';

const BOLD = 'Manrope_700Bold';

/** Renders **bold** markdown segments inline. */
function renderContent(text: string, boldColor: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={{ fontFamily: BOLD, color: boldColor }}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
}

export function ChatBubble({ message, reduceMotion }: { message: ChatMessage; reduceMotion: boolean }) {
  const isUser = message.role === 'user';
  const textColor = isUser ? C.voltInk : C.text;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(220)}
      style={[styles.wrap, isUser ? styles.wrapUser : styles.wrapAI]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="flash" size={12} color={C.volt} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[T.body, { color: textColor, fontSize: 15, lineHeight: 22 }]}>
          {renderContent(message.content, textColor)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: S.sm, gap: S.sm },
  wrapUser: { justifyContent: 'flex-end' },
  wrapAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  bubble: { maxWidth: '82%', borderRadius: R.lg, paddingHorizontal: S.base, paddingVertical: S.md - 2 },
  bubbleAI: {
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: C.volt,
    borderBottomRightRadius: 4,
  },
});
