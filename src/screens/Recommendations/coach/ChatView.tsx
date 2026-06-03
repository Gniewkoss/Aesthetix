import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Platform, ActivityIndicator, Keyboard, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PhysiqueAnalysis } from '../../../types';
import { useChatStore } from '../../../store/useChatStore';
import { getSuggestedQuestions } from '../../../api/chat';
import { C, T, R, S, LAYOUT } from '../../../theme/obsidian';
import { getTabBarClearance } from '../../../navigation/liquid-tab-bar';
import { ChatBubble } from './ChatBubble';
import { TypingDots } from './TypingDots';

export function ChatView({ analysis, reduceMotion }: { analysis: PhysiqueAnalysis; reduceMotion: boolean }) {
  const { messages, isLoading, error, sendMessage, initForAnalysis, clearMessages, clearError } = useChatStore();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const suggestions = getSuggestedQuestions(analysis);

  const tabBarClearance = getTabBarClearance(insets.bottom, S.md);
  const bottomPad = keyboardHeight > 0 ? keyboardHeight : tabBarClearance;

  useEffect(() => { initForAnalysis(analysis); }, [analysis.id]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setShowSuggestions(false);
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, isLoading]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isLoading) return;
    setInputText('');
    setShowSuggestions(false);
    Keyboard.dismiss();
    await sendMessage(msg, analysis);
  }, [inputText, isLoading, analysis]);

  const handleClear = () => {
    Alert.alert('Clear conversation', 'Start a fresh chat with your AI coach?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearMessages(analysis.id);
          await initForAnalysis(analysis);
        },
      },
    ]);
  };

  const toggleSuggestions = () => {
    setShowSuggestions((v) => {
      if (!v) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
      return !v;
    });
  };

  const canSend = !!inputText.trim() && !isLoading;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={[T.caption, { color: C.text3 }]}>
          {messages.length > 1 ? `${messages.length - 1} message${messages.length > 2 ? 's' : ''}` : 'New conversation'}
        </Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7} accessibilityLabel="Clear conversation" accessibilityRole="button">
          <Ionicons name="trash-outline" size={13} color={C.text3} />
          <Text style={[T.caption, { color: C.text3 }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} reduceMotion={reduceMotion} />
        ))}

        {isLoading && (
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(150)} style={styles.typingWrap}>
            <View style={styles.avatar}>
              <Ionicons name="flash" size={12} color={C.volt} />
            </View>
            <View style={styles.typingBubble}>
              <TypingDots reduceMotion={reduceMotion} />
            </View>
          </Animated.View>
        )}

        {error && (
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(150)} style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={14} color={C.danger} />
            <Text style={[T.caption, { color: C.danger, flex: 1 }]}>{error}</Text>
            <TouchableOpacity onPress={clearError} accessibilityLabel="Dismiss error">
              <Ionicons name="close" size={14} color={C.text3} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: S.lg }} />
      </ScrollView>

      {/* Suggestions */}
      {showSuggestions && (
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(180)} style={styles.suggestions}>
          <Text style={[T.overline, { color: C.text3, marginLeft: 2, marginBottom: S.xs }]}>QUICK QUESTIONS</Text>
          {suggestions.map((q) => (
            <TouchableOpacity key={q} style={styles.suggestChip} onPress={() => { setShowSuggestions(false); handleSend(q); }} activeOpacity={0.7}>
              <Text style={[T.bodySm, { color: C.text2, flex: 1, marginRight: S.sm }]}>{q}</Text>
              <Ionicons name="arrow-forward" size={12} color={C.volt} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.iconBtn, showSuggestions && styles.iconBtnActive]}
          onPress={toggleSuggestions}
          activeOpacity={0.75}
          accessibilityLabel={showSuggestions ? 'Hide quick questions' : 'Show quick questions'}
          accessibilityRole="button"
        >
          <Ionicons name={showSuggestions ? 'close' : 'bulb-outline'} size={16} color={showSuggestions ? C.volt : C.text3} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your coach anything…"
          placeholderTextColor={C.text3}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={() => handleSend()}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!canSend}
          activeOpacity={0.8}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend }}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={C.voltInk} />
            : <Ionicons name="arrow-up" size={18} color={canSend ? C.voltInk : C.text3} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: S.sm,
  },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: S.sm },

  scrollContent: { paddingHorizontal: LAYOUT.screenX, paddingTop: S.sm },

  typingWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: S.sm, marginBottom: S.sm },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.voltDim, borderWidth: 1, borderColor: C.voltBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  typingBubble: {
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: 'rgba(255,92,92,0.10)',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,92,92,0.28)',
    padding: S.md,
    marginBottom: S.sm,
  },

  suggestions: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.sm,
    paddingBottom: S.xs,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    backgroundColor: C.canvas,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface1,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.md,
    paddingVertical: 10,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: S.sm,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: S.md,
    paddingBottom: S.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    backgroundColor: C.canvas,
    zIndex: 10,
    elevation: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: R.md,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconBtnActive: { backgroundColor: C.voltDim, borderColor: C.voltBorder },
  input: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.base,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    // NOTE: do not set lineHeight here — on iOS it clips text in a multiline TextInput.
    color: C.text,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    textAlignVertical: 'top',
    maxHeight: 110,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.volt,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
});
