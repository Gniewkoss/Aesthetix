import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useChatStore } from '../../store/useChatStore';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { REDESIGN } from '../../theme/redesign-new';
import { getSuggestedQuestions } from '../../api/chat';
import { ChatMessage } from '../../types';

const { COLORS, FONTS, SPACING, RADIUS, SHADOWS, LAYOUT } = REDESIGN;

type Nav = NativeStackNavigationProp<RootStackParamList>;

function TypingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 500, easing: Easing.inOut(Easing.ease) };
    dot1.value = withRepeat(withTiming(1, cfg), -1, true);
    const t2 = setTimeout(() => { dot2.value = withRepeat(withTiming(1, cfg), -1, true); }, 160);
    const t3 = setTimeout(() => { dot3.value = withRepeat(withTiming(1, cfg), -1, true); }, 320);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7 }));
  const d2 = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7 }));
  const d3 = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7 }));

  return (
    <View style={styles.typingRow}>
      <Animated.View style={[styles.typingDot, d1]} />
      <Animated.View style={[styles.typingDot, d2]} />
      <Animated.View style={[styles.typingDot, d3]} />
    </View>
  );
}

export function RecommendationsScreenRedesign() {
  const navigation = useNavigation<Nav>();
  const { currentAnalysis } = useAnalysisStore();
  const { messages, sendMessage, isLoading } = useChatStore();
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!currentAnalysis) return;
    const loadQuestions = async () => {
      const questions = await getSuggestedQuestions(currentAnalysis);
      setSuggestedQuestions(questions.slice(0, 3));
    };
    loadQuestions();
  }, [currentAnalysis]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentAnalysis) return;
    setUserInput('');
    Keyboard.dismiss();

    try {
      await sendMessage(text, currentAnalysis);
    } catch {
      Alert.alert('Error', 'Failed to send message');
    }
  }, [currentAnalysis, sendMessage]);

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  if (!currentAnalysis) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageHeader variant="tab" title="AI Coach" subtitle="Get personalized advice" />
          <EmptyState
            iconName="flash-outline"
            iconColor={COLORS.primary}
            title="No analysis available"
            subtitle="Run a physique analysis first to get\npersonalized recommendations from your AI coach."
          >
            <Button variant="default" size="lg" onPress={() => navigation.navigate('Upload')}>
              Start Scan
            </Button>
          </EmptyState>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <PageHeader variant="tab" title="AI Coach" subtitle="Personalized guidance" />

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && suggestedQuestions.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>Ask me anything</Text>
              <View style={styles.suggestedGrid}>
                {suggestedQuestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestedCard}
                    onPress={() => handleSuggestedQuestion(q)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.suggestedText}>{q}</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {messages.map((msg, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.duration(300)}
              style={[styles.messageRow, msg.role === 'user' && styles.userMessage]}
            >
              <View style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}>
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' && styles.userText,
                ]}>
                  {msg.content}
                </Text>
              </View>
            </Animated.View>
          ))}

          {isLoading && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.messageRow}>
              <View style={styles.aiBubble}>
                <TypingDots />
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inputContainer}
        >
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your physique..."
              placeholderTextColor={COLORS.text.muted}
              value={userInput}
              onChangeText={setUserInput}
              editable={!isLoading}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={() => handleSendMessage(userInput)}
              disabled={!userInput.trim() || isLoading}
              style={[styles.sendBtn, (!userInput.trim() || isLoading) && styles.sendBtnDisabled]}
            >
              <Ionicons name="send" size={18} color={userInput.trim() && !isLoading ? '#FFFFFF' : COLORS.text.muted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },

  messagesContainer: {
    padding: LAYOUT.screenPad,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  suggestedSection: {
    marginBottom: SPACING.lg,
  },

  suggestedTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.family.heading,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },

  suggestedGrid: {
    gap: SPACING.md,
  },

  suggestedCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOWS.sm,
  },

  suggestedText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.family.body,
    color: COLORS.text.primary,
    lineHeight: FONTS.sizes.sm * 1.4,
  },

  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  userMessage: {
    justifyContent: 'flex-end',
  },

  messageBubble: {
    maxWidth: '80%',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },

  aiBubble: {
    backgroundColor: COLORS.bg.card,
    ...SHADOWS.sm,
  },

  userBubble: {
    backgroundColor: COLORS.primary,
  },

  messageText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.family.body,
    color: COLORS.text.secondary,
    lineHeight: FONTS.sizes.base * 1.5,
  },

  userText: {
    color: '#FFFFFF',
  },

  typingRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    height: 20,
    alignItems: 'center',
  },

  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  inputContainer: {
    paddingHorizontal: LAYOUT.screenPad,
    paddingVertical: SPACING.base,
    paddingBottom: SPACING.lg,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.md,
  },

  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.family.body,
    maxHeight: 100,
    minHeight: 40,
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
