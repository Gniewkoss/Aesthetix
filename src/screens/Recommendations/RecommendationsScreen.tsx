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
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useChatStore } from '../../store/useChatStore';
import { RecommendationCard } from '../../components/analysis/RecommendationCard';
import {
  COLORS,
  FONT_FAMILY,
  FONTS,
  RADIUS,
  SPACING,
  TRACKING,
  getScoreColor,
  getScoreLabel,
} from '../../theme';
import { MOCK_ANALYSIS } from '../../api/mock';
import { getSuggestedQuestions } from '../../api/chat';
import { ChatMessage } from '../../types';

// ─── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 500, easing: Easing.inOut(Easing.ease) };
    dot1.value = withRepeat(withTiming(1, cfg), -1, true);
    setTimeout(() => { dot2.value = withRepeat(withTiming(1, cfg), -1, true); }, 160);
    setTimeout(() => { dot3.value = withRepeat(withTiming(1, cfg), -1, true); }, 320);
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7 }));
  const d2 = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7 }));
  const d3 = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7 }));

  return (
    <View style={dotStyles.row}>
      <Animated.View style={[dotStyles.dot, d1]} />
      <Animated.View style={[dotStyles.dot, d2]} />
      <Animated.View style={[dotStyles.dot, d3]} />
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 4, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
});

// ─── Single chat bubble ────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  // Render **bold** markdown-style text
  function renderContent(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={i} style={{ fontFamily: FONT_FAMILY.bodySemibold }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapAI]}
    >
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="flash" size={12} color={COLORS.accent} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {renderContent(message.content)}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Chat tab ─────────────────────────────────────────────────────────────────

function ChatTab({ analysis }: { analysis: typeof MOCK_ANALYSIS }) {
  const { messages, isLoading, error, sendMessage, initForAnalysis, clearError } = useChatStore();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const suggestions = getSuggestedQuestions(analysis);

  useEffect(() => {
    initForAnalysis(analysis);
  }, [analysis.id]);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages.length, isLoading]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text ?? inputText).trim();
      if (!msg || isLoading) return;
      setInputText('');
      Keyboard.dismiss();
      await sendMessage(msg, analysis);
    },
    [inputText, isLoading, analysis],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Message list */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <Animated.View entering={FadeIn.duration(150)} style={[styles.bubbleWrap, styles.bubbleWrapAI]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="flash" size={12} color={COLORS.accent} />
            </View>
            <View style={[styles.bubble, styles.bubbleAI, { paddingVertical: 12, paddingHorizontal: 14 }]}>
              <TypingDots />
            </View>
          </Animated.View>
        )}

        {/* Error banner */}
        {error && (
          <Animated.View entering={FadeIn.duration(150)} style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={14} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={14} color={COLORS.text.disabled} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Suggested questions — shown when only the welcome message exists */}
        {messages.length <= 1 && !isLoading && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.suggestionsWrap}>
            <Text style={styles.suggestionsLabel}>QUICK QUESTIONS</Text>
            {suggestions.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.suggestionChip}
                onPress={() => handleSend(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{q}</Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.accent} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <View style={{ height: SPACING.lg }} />
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your coach anything..."
          placeholderTextColor={COLORS.text.disabled}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          activeOpacity={0.75}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Plan tab (existing recommendations content) ───────────────────────────────

function PlanTab({ analysis }: { analysis: typeof MOCK_ANALYSIS }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Score brief */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.scoreBrief}>
        <View style={styles.scoreBriefLeft}>
          <Text style={[styles.scoreBriefNumber, { color: getScoreColor(analysis.overallScore) }]}>
            {analysis.overallScore}
          </Text>
          <View style={[styles.scoreLabelBadge, { backgroundColor: `${getScoreColor(analysis.overallScore)}18`, borderColor: `${getScoreColor(analysis.overallScore)}30` }]}>
            <Text style={[styles.scoreLabelText, { color: getScoreColor(analysis.overallScore) }]}>
              {getScoreLabel(analysis.overallScore)}
            </Text>
          </View>
        </View>
        <View style={styles.scoreBriefRight}>
          <View style={styles.scoreBriefStat}>
            <Text style={styles.scoreBriefStatLabel}>BODY FAT</Text>
            <Text style={styles.scoreBriefStatValue}>{analysis.bodyFatRange ?? `${analysis.bodyFat}%`}</Text>
          </View>
          <View style={styles.scoreBriefDivider} />
          <View style={styles.scoreBriefStat}>
            <Text style={styles.scoreBriefStatLabel}>POTENTIAL</Text>
            <Text style={styles.scoreBriefStatValue}>{analysis.predictedPotentialScore}</Text>
          </View>
          <View style={styles.scoreBriefDivider} />
          <View style={styles.scoreBriefStat}>
            <Text style={styles.scoreBriefStatLabel}>PRIORITY</Text>
            <Text style={styles.scoreBriefStatValue} numberOfLines={1}>
              {analysis.improvementPlan[0]?.area ?? '—'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Improvement Plan */}
      <Animated.View entering={FadeInDown.duration(350)}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="trophy-outline" size={14} color={COLORS.accent} />
          </View>
          <Text style={styles.sectionTitle}>Improvement Plan</Text>
        </View>
        {analysis.improvementPlan.map((item) => (
          <RecommendationCard key={item.priority} item={item} />
        ))}
      </Animated.View>

      {/* Dietary Recommendations */}
      <Animated.View entering={FadeInDown.delay(100).duration(350)}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenBorder }]}>
            <Ionicons name="nutrition-outline" size={14} color={COLORS.green} />
          </View>
          <Text style={styles.sectionTitle}>Nutrition Protocol</Text>
        </View>
        {analysis.dietaryRecommendations.map((rec, i) => (
          <View key={i} style={styles.dietCard}>
            <View style={styles.dietBadge}>
              <Text style={styles.dietBadgeText}>{rec.category}</Text>
            </View>
            <Text style={styles.dietRec}>{rec.recommendation}</Text>
            <Text style={styles.dietRationale}>{rec.rationale}</Text>
          </View>
        ))}
      </Animated.View>

      <View style={{ height: SPACING['3xl'] }} />
    </ScrollView>
  );
}

// ─── Root screen ───────────────────────────────────────────────────────────────

type Tab = 'plan' | 'chat';

export function RecommendationsScreen() {
  const { currentAnalysis, loadHistory, history } = useAnalysisStore();
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  useEffect(() => {
    if (!currentAnalysis && history.length === 0) loadHistory();
  }, []);

  const analysis = currentAnalysis ?? (history.length > 0 ? history[history.length - 1] : MOCK_ANALYSIS);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>AI Coach</Text>
              <Text style={styles.subtitle}>
                {activeTab === 'plan' ? 'Personalised improvement plan' : 'Ask your coach anything'}
              </Text>
            </View>
            {activeTab === 'chat' && (
              <View style={styles.aiPill}>
                <View style={styles.aiDot} />
                <Text style={styles.aiPillText}>Max</Text>
              </View>
            )}
          </View>

          {/* Tab switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'plan' && styles.tabBtnActive]}
              onPress={() => setActiveTab('plan')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'plan' ? 'trophy' : 'trophy-outline'}
                size={14}
                color={activeTab === 'plan' ? '#fff' : COLORS.text.muted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'plan' && styles.tabBtnTextActive]}>
                Plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'chat' && styles.tabBtnActive]}
              onPress={() => setActiveTab('chat')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'chat' ? 'chatbubbles' : 'chatbubbles-outline'}
                size={14}
                color={activeTab === 'chat' ? '#fff' : COLORS.text.muted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'chat' && styles.tabBtnTextActive]}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'plan' ? (
            <PlanTab analysis={analysis} />
          ) : (
            <ChatTab analysis={analysis} />
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.display,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  aiPillText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    letterSpacing: TRACKING.label,
  },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
  },
  tabBtnText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.label,
  },
  tabBtnTextActive: {
    color: '#fff',
  },

  // ── Plan tab ──
  scroll: { paddingHorizontal: SPACING.lg },

  scoreBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
    gap: SPACING.base,
  },
  scoreBriefLeft: {
    alignItems: 'center',
    gap: 6,
    paddingRight: SPACING.base,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  scoreBriefNumber: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['4xl'],
  },
  scoreLabelBadge: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  scoreLabelText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
  },
  scoreBriefRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreBriefStat: { flex: 1, alignItems: 'center', gap: 4 },
  scoreBriefStatLabel: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.caps,
  },
  scoreBriefStatValue: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  scoreBriefDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xl,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.heading,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.label,
  },

  dietCard: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.base,
    marginBottom: 10,
  },
  dietBadge: {
    backgroundColor: COLORS.greenDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: SPACING.sm,
  },
  dietBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
  },
  dietRec: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    marginBottom: SPACING.sm,
  },
  dietRationale: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.65,
  },

  // ── Chat tab ──
  chatScroll: { flex: 1 },
  chatScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  bubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapAI: { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleAI: {
    backgroundColor: COLORS.glass.bg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  bubbleUser: {
    backgroundColor: COLORS.accent,
  },
  bubbleText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.6,
  },
  bubbleTextUser: {
    color: '#fff',
  },

  suggestionsWrap: {
    marginTop: SPACING.base,
    gap: SPACING.xs,
  },
  suggestionsLabel: {
    color: COLORS.text.disabled,
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
    marginBottom: 4,
    marginLeft: 2,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
  },
  suggestionText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
    marginRight: SPACING.sm,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.redDim,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: COLORS.bg.primary,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
});
