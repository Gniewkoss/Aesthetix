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
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useChatStore } from '../../store/useChatStore';
import { RecommendationCard } from '../../components/analysis/RecommendationCard';
import { SeverityBadge } from '../../components/ui/SeverityBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { TAB_SCROLL_CONTENT } from '../../components/common/tabScreenLayout';
import { SectionLabel } from '../../components/common/SectionLabel';
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
import { ChatMessage, PhysiqueAnalysis } from '../../types';
import { MUSCLE_GROUP_META } from '../../constants';

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

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

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

function ChatTab({ analysis }: { analysis: PhysiqueAnalysis }) {
  const { messages, isLoading, error, sendMessage, initForAnalysis, clearMessages, clearError } =
    useChatStore();
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const suggestions = getSuggestedQuestions(analysis);

  useEffect(() => {
    initForAnalysis(analysis);
  }, [analysis.id]);

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
      setShowSuggestions(false);
      Keyboard.dismiss();
      await sendMessage(msg, analysis);
    },
    [inputText, isLoading, analysis],
  );

  const handleClear = () => {
    Alert.alert(
      'Clear conversation',
      'Start a fresh chat with your AI coach?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearMessages(analysis.id);
            // Force re-init by temporarily nulling the tracked ID via clearMessages,
            // then call initForAnalysis which will now see no persisted messages.
            await initForAnalysis(analysis);
          },
        },
      ],
    );
  };

  const handleSuggestionTap = (q: string) => {
    setShowSuggestions(false);
    handleSend(q);
  };

  const toggleSuggestions = () => {
    setShowSuggestions((v) => {
      if (!v) {
        // Scroll to bottom so last message isn't hidden behind the panel
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
      }
      return !v;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Clear button row */}
      <View style={styles.chatToolbar}>
        <Text style={styles.chatToolbarInfo}>
          {messages.length > 1 ? `${messages.length - 1} message${messages.length > 2 ? 's' : ''}` : 'New conversation'}
        </Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={14} color={COLORS.text.muted} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

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

        {error && (
          <Animated.View entering={FadeIn.duration(150)} style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={14} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={14} color={COLORS.text.disabled} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: SPACING.lg }} />
      </ScrollView>

      {/* Suggestions panel */}
      {showSuggestions && (
        <Animated.View entering={FadeInDown.duration(180)} style={styles.suggestionsPanel}>
          <Text style={styles.suggestionsLabel}>QUICK QUESTIONS</Text>
          {suggestions.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionTap(q)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{q}</Text>
              <Ionicons name="arrow-forward" size={12} color={COLORS.accent} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.suggestBtn, showSuggestions && styles.suggestBtnActive]}
          onPress={toggleSuggestions}
          activeOpacity={0.75}
        >
          <Ionicons
            name={showSuggestions ? 'close' : 'bulb-outline'}
            size={16}
            color={showSuggestions ? COLORS.accent : COLORS.text.muted}
          />
        </TouchableOpacity>

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
    </View>
  );
}

// ─── Plan tab ─────────────────────────────────────────────────────────────────

function PlanTab({ analysis }: { analysis: PhysiqueAnalysis }) {
  const visibleMuscles = Object.entries(analysis.muscleGroups).filter(
    ([, g]) => g.visible && g.score > 0,
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Score brief */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.scoreBrief}>
        <View style={styles.scoreBriefTop}>
          <View style={styles.scoreBriefMain}>
            <Text style={styles.scoreBriefCaption}>Physique score</Text>
            <View style={styles.scoreBriefScoreRow}>
              <Text style={[styles.scoreBriefNumber, { color: getScoreColor(analysis.overallScore) }]}>
                {analysis.overallScore}
              </Text>
              <View style={[styles.scoreLabelBadge, { backgroundColor: `${getScoreColor(analysis.overallScore)}18`, borderColor: `${getScoreColor(analysis.overallScore)}30` }]}>
                <Text style={[styles.scoreLabelText, { color: getScoreColor(analysis.overallScore) }]}>
                  {getScoreLabel(analysis.overallScore)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.scoreBriefStats}>
          <View style={styles.scoreBriefStat}>
            <Text style={styles.scoreBriefStatLabel}>Body fat</Text>
            <Text style={styles.scoreBriefStatValue}>{analysis.bodyFatRange ?? `${analysis.bodyFat}%`}</Text>
          </View>
          <View style={styles.scoreBriefStat}>
            <Text style={styles.scoreBriefStatLabel}>Symmetry</Text>
            <Text style={styles.scoreBriefStatValue}>{analysis.symmetryScore}%</Text>
          </View>
          <View style={styles.scoreBriefStat}>
            <Text style={styles.scoreBriefStatLabel}>Potential</Text>
            <Text style={styles.scoreBriefStatValue}>{analysis.predictedPotentialScore}</Text>
          </View>
        </View>
      </Animated.View>

      {/* AI Summary */}
      {analysis.summary ? (
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="sparkles" size={14} color={COLORS.accent} />
            </View>
            <SectionLabel label="Coach Assessment" tier="title" inline />
          </View>
          <Text style={styles.summaryText}>{analysis.summary}</Text>
        </Animated.View>
      ) : null}

      {/* Muscle Score Overview */}
      {visibleMuscles.length > 0 && (
        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.indigoDim, borderColor: COLORS.indigoBorder }]}>
              <Ionicons name="body-outline" size={14} color={COLORS.indigo} />
            </View>
            <SectionLabel label="Muscle Scores" tier="title" inline />
          </View>
          <View style={styles.muscleGrid}>
            {visibleMuscles.map(([key, group]) => (
              <View key={key} style={styles.muscleGridItem}>
                <Text style={styles.muscleGridLabel}>
                  {MUSCLE_GROUP_META[key as keyof typeof MUSCLE_GROUP_META]?.label ?? key}
                </Text>
                <View style={styles.muscleScoreBar}>
                  <View
                    style={[
                      styles.muscleScoreBarFill,
                      {
                        width: `${group.score}%` as any,
                        backgroundColor: getScoreColor(group.score),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.muscleGridScore, { color: getScoreColor(group.score) }]}>
                  {group.score}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Improvement Plan */}
      <Animated.View entering={FadeInDown.delay(100).duration(350)}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="trophy-outline" size={14} color={COLORS.accent} />
          </View>
          <SectionLabel label="Improvement Plan" tier="title" inline />
        </View>
        {analysis.improvementPlan.map((item) => (
          <RecommendationCard key={item.priority} item={item} />
        ))}
      </Animated.View>

      {/* Issues Detected */}
      {analysis.issuesDetected.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).duration(350)}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.amberDim, borderColor: COLORS.amberBorder }]}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.amber} />
            </View>
            <SectionLabel label="Issues Detected" tier="title" inline />
          </View>
          {analysis.issuesDetected.map((issue) => (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.issueHeader}>
                <SeverityBadge severity={issue.severity} />
                <View style={styles.issueCategoryBadge}>
                  <Text style={styles.issueCategoryText}>{issue.category.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <Text style={styles.issueDesc}>{issue.description}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Dietary Recommendations */}
      <Animated.View entering={FadeInDown.delay(200).duration(350)}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenBorder }]}>
            <Ionicons name="nutrition-outline" size={14} color={COLORS.green} />
          </View>
          <SectionLabel label="Nutrition Protocol" tier="title" inline />
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

      {/* Glow Up Prediction */}
      {analysis.glowUpPrediction ? (
        <Animated.View entering={FadeInDown.delay(250).duration(350)}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.25)' }]}>
              <Ionicons name="trending-up" size={14} color={COLORS.amber} />
            </View>
            <SectionLabel label="Glow-Up Projection" tier="title" inline />
          </View>
          <View style={styles.glowCard}>
            <View style={styles.glowScoreRow}>
              <View style={styles.glowScoreBlock}>
                <Text style={styles.glowScoreLabel}>NOW</Text>
                <Text style={[styles.glowScoreNum, { color: getScoreColor(analysis.overallScore) }]}>
                  {analysis.overallScore}
                </Text>
              </View>
              <View style={styles.glowArrow}>
                <Ionicons name="arrow-forward" size={18} color={COLORS.amber} />
              </View>
              <View style={styles.glowScoreBlock}>
                <Text style={styles.glowScoreLabel}>POTENTIAL</Text>
                <Text style={[styles.glowScoreNum, { color: COLORS.amber }]}>
                  {analysis.predictedPotentialScore}
                </Text>
              </View>
            </View>
            <Text style={styles.glowText}>{analysis.glowUpPrediction}</Text>
          </View>
        </Animated.View>
      ) : null}

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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={activeTab === 'chat'}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <PageHeader
          variant="tab"
          title="AI Coach"
          subtitle={activeTab === 'plan' ? 'Improvement plan' : 'Ask your coach'}
          rightComponent={
            activeTab === 'chat' ? (
              <View style={styles.aiPill}>
                <View style={styles.aiDot} />
                <Text style={styles.aiPillText}>Max</Text>
              </View>
            ) : undefined
          }
        />

        {/* Tab switcher */}
        <View style={styles.tabSwitcherWrap}>
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
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  tabSwitcherWrap: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
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
    borderColor: COLORS.border.subtle,
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
  tabBtnActive: { backgroundColor: COLORS.accent },
  tabBtnText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.label,
  },
  tabBtnTextActive: { color: '#fff' },

  // ── Plan tab ──
  scroll: TAB_SCROLL_CONTENT,

  scoreBrief: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  scoreBriefTop: {
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.hairline,
  },
  scoreBriefMain: { gap: 6 },
  scoreBriefCaption: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
  },
  scoreBriefScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
  scoreLabelText: { fontSize: FONTS.sizes.xs, fontFamily: FONT_FAMILY.bodyBold, letterSpacing: TRACKING.caps },
  scoreBriefStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  scoreBriefStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  scoreBriefStatLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.caps,
    textTransform: 'uppercase',
  },
  scoreBriefStatValue: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },

  summaryCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    minHeight: 28,
  },
  summaryText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.7,
  },

  muscleGrid: {
    gap: 8,
    marginBottom: SPACING.sm,
  },
  muscleGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  muscleGridLabel: {
    width: 72,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text.secondary,
  },
  muscleScoreBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border.hairline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  muscleScoreBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  muscleGridScore: {
    width: 28,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodySemibold,
    textAlign: 'right',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    minHeight: 28,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  issueCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    marginBottom: 10,
    gap: SPACING.sm,
  },
  issueHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  issueCategoryBadge: {
    backgroundColor: COLORS.glass.bg,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
  },
  issueCategoryText: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
  },
  issueTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
  },
  issueDesc: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.65,
  },

  dietCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
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

  glowCard: {
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  glowScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  glowScoreBlock: { alignItems: 'center', gap: 4 },
  glowScoreLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text.disabled,
    letterSpacing: TRACKING.caps,
  },
  glowScoreNum: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
  },
  glowArrow: { flex: 1, alignItems: 'center' },
  glowText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.65,
  },

  // ── Chat tab ──
  chatToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  chatToolbarInfo: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  clearBtnText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
  },

  chatScroll: { flex: 1 },
  chatScrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },

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
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  bubbleUser: { backgroundColor: COLORS.accent },
  bubbleText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: FONTS.sizes.sm * 1.6,
  },
  bubbleTextUser: { color: '#fff' },

  suggestionsPanel: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.hairline,
    backgroundColor: COLORS.bg.primary,
  },
  suggestionsLabel: {
    color: COLORS.text.disabled,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: TRACKING.caps,
    marginBottom: 2,
    marginLeft: 2,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
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
    borderTopColor: COLORS.border.hairline,
    backgroundColor: COLORS.bg.primary,
  },
  suggestBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  suggestBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBorder,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
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
