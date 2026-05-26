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
  runOnJS,
} from 'react-native-reanimated';
import { TIMING_STD } from '../../motion';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useChatStore } from '../../store/useChatStore';
import { RecommendationCard } from '../../components/analysis/RecommendationCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import {
  COLORS,
  FONT_FAMILY,
  FONTS,
  LAYOUT,
  RADIUS,
  SPACING,
  TRACKING,
  getScoreColor,
  getScoreLabel,
} from '../../theme';
import { getSuggestedQuestions } from '../../api/chat';
import { ChatMessage, PhysiqueAnalysis } from '../../types';

// ─── Typing indicator ──────────────────────────────────────────────────────────

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
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setShowSuggestions(false),
    );
    return () => showSub.remove();
  }, []);

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
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
          accessibilityLabel={showSuggestions ? 'Hide quick questions' : 'Show quick questions'}
          accessibilityRole="button"
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
          accessibilityLabel="Send message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !inputText.trim() || isLoading }}
          disabled={!inputText.trim() || isLoading}
          activeOpacity={0.75}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.text.onAccent} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={COLORS.text.onAccent} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Tab switcher — sliding pill, fixed height ────────────────────────────────

type CoachTab = 'plan' | 'chat';

function CoachTabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: CoachTab;
  onChange: (tab: CoachTab) => void;
}) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const index = useSharedValue(activeTab === 'plan' ? 0 : 1);

  React.useEffect(() => {
    index.value = withTiming(activeTab === 'plan' ? 0 : 1, TIMING_STD);
  }, [activeTab]);

  const pillStyle = useAnimatedStyle(() => {
    if (trackWidth <= 0) return { opacity: 0 };
    const inner = trackWidth - 6;
    const tabW = inner / 2;
    return {
      opacity: 1,
      width: tabW,
      transform: [{ translateX: index.value * tabW }],
    };
  });

  const tabs: { key: CoachTab; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'plan', icon: 'trophy-outline', iconActive: 'trophy', label: 'Plan' },
    { key: 'chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', label: 'Chat' },
  ];

  return (
    <View style={styles.tabSwitcherWrap}>
      <View
        style={styles.tabSwitcher}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.tabPill, pillStyle]} />
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabBtn}
              onPress={() => onChange(tab.key)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.key === 'plan' ? 'Improvement plan' : 'Coach chat'}
            >
              <Ionicons
                name={selected ? tab.iconActive : tab.icon}
                size={14}
                color={selected ? COLORS.text.onAccent : COLORS.text.muted}
              />
              <Text style={[styles.tabBtnText, selected && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Plan tab ─────────────────────────────────────────────────────────────────

function PlanTab({ analysis }: { analysis: PhysiqueAnalysis }) {
  const scoreColor = getScoreColor(analysis.overallScore);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Compact score anchor */}
      <View style={styles.scoreStrip}>
        <View style={[styles.scoreStripBar, { backgroundColor: scoreColor }]} />
        <View style={styles.scoreStripContent}>
          <View style={styles.scoreStripLeft}>
            <Text style={[styles.scoreStripNumber, { color: scoreColor }]}>
              {analysis.overallScore}
            </Text>
            <Badge
              variant="secondary"
              size="sm"
              style={{ backgroundColor: scoreColor + '14', borderColor: scoreColor + '30' }}
              textStyle={{ color: scoreColor }}
            >
              {getScoreLabel(analysis.overallScore)}
            </Badge>
          </View>
          <View style={styles.scoreStripMetaGroup}>
            <Text style={styles.scoreStripMeta}>
              BF {analysis.bodyFatRange ?? `${analysis.bodyFat}%`}
            </Text>
            <Text style={styles.scoreStripMetaSep}>·</Text>
            <Text style={styles.scoreStripMeta}>
              Potential {analysis.predictedPotentialScore}
            </Text>
          </View>
        </View>
      </View>

      {/* Coach Assessment */}
      {analysis.summary ? (
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="sparkles" size={14} color={COLORS.accent} />
            </View>
            <Text style={styles.sectionTitle}>Coach Assessment</Text>
          </View>
          <Text style={styles.summaryText}>{analysis.summary}</Text>
        </Animated.View>
      ) : null}

      {/* Improvement Plan */}
      <Animated.View entering={FadeInDown.delay(100).duration(350)}>
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

      {/* Nutrition Protocol */}
      <Animated.View entering={FadeInDown.delay(160).duration(350)}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenBorder }]}>
            <Ionicons name="nutrition-outline" size={14} color={COLORS.green} />
          </View>
          <Text style={styles.sectionTitle}>Nutrition Protocol</Text>
        </View>
        {analysis.dietaryRecommendations.map((rec, i) => (
          <View key={i} style={styles.dietCard}>
            <Badge variant="success" size="sm" style={styles.dietBadgeSpacing}>{rec.category}</Badge>
            <Text style={styles.dietRec}>{rec.recommendation}</Text>
            <Text style={styles.dietRationale}>{rec.rationale}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Glow-Up Projection */}
      {analysis.glowUpPrediction ? (
        <Animated.View entering={FadeInDown.delay(220).duration(350)}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.amberDim, borderColor: COLORS.amberBorder }]}>
              <Ionicons name="trending-up" size={14} color={COLORS.amber} />
            </View>
            <Text style={styles.sectionTitle}>Glow-Up Projection</Text>
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
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RecommendationsScreen() {
  const navigation = useNavigation<Nav>();
  const { currentAnalysis, loadHistory, history } = useAnalysisStore();
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [displayTab, setDisplayTab] = useState<Tab>('plan');
  const contentOpacity = useSharedValue(1);

  const switchTab = useCallback((tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    contentOpacity.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.cubic) }, (done) => {
      if (!done) return;
      runOnJS(setDisplayTab)(tab);
      contentOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    });
  }, [activeTab, contentOpacity]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  useEffect(() => {
    if (!currentAnalysis && history.length === 0) loadHistory();
  }, []);

  const analysis = currentAnalysis ?? (history.length > 0 ? history[history.length - 1] : null);

  if (!analysis) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageHeader variant="tab" title="AI Coach" subtitle="Personalized coaching" />
          <EmptyState
            iconName="flash-outline"
            iconColor={COLORS.accent}
            title="No scan data yet"
            subtitle="Complete your first physique scan to unlock your AI improvement plan and coach chat."
          >
            <Button
              variant="brand"
              size="lg"
              onPress={() => navigation.navigate('Upload')}
              trailingIcon={<Ionicons name="arrow-forward" size={14} color={COLORS.text.onAccent} />}
            >
              Start First Scan
            </Button>
          </EmptyState>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <PageHeader
          variant="tab"
          title="AI Coach"
          subtitle="Plan & coach chat"
          rightComponent={
            <View style={styles.headerRightSlot}>
              <View style={[styles.aiPill, activeTab !== 'chat' && styles.aiPillHidden]}>
                <View style={styles.aiDot} />
                <Text style={styles.aiPillText}>Max</Text>
              </View>
            </View>
          }
        />

        <CoachTabSwitcher activeTab={activeTab} onChange={switchTab} />

        <Animated.View style={[{ flex: 1 }, contentAnimStyle]}>
          {displayTab === 'plan' ? (
            <PlanTab analysis={analysis} />
          ) : (
            <ChatTab analysis={analysis} />
          )}
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },

  headerRightSlot: {
    minWidth: 68,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 28,
  },
  aiPillHidden: {
    opacity: 0,
  },

  tabSwitcherWrap: {
    paddingHorizontal: LAYOUT.pagePad,
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
    height: 44,
    position: 'relative',
  },
  tabPill: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabBtnText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.muted,
    letterSpacing: TRACKING.label,
  },
  tabBtnTextActive: { color: COLORS.text.onAccent },

  // ── Plan tab ──
  scroll: {
    paddingHorizontal: LAYOUT.pagePad,
    paddingBottom: LAYOUT.tabScrollBottom,
  },

  // Compact 1-line score anchor — context without redundancy
  scoreStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.hairline,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  scoreStripBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  scoreStripContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  scoreStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 0,
  },
  scoreStripNumber: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: TRACKING.display,
    lineHeight: FONTS.sizes['2xl'] * FONTS.lineHeights.tight,
  },
  scoreStripMetaGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 4,
    minWidth: 0,
  },
  scoreStripMeta: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    textAlign: 'right',
  },
  scoreStripMetaSep: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.disabled,
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
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
    letterSpacing: TRACKING.heading,
  },
  dietCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  dietBadgeSpacing: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
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
    paddingHorizontal: LAYOUT.pagePad,
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
  chatScrollContent: { paddingHorizontal: LAYOUT.pagePad, paddingTop: SPACING.sm },

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
    borderRadius: 18,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleAI: {
    backgroundColor: COLORS.bg.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border.subtle,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
  },
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
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
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
    paddingHorizontal: LAYOUT.pagePad,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.hairline,
    backgroundColor: COLORS.bg.primary,
  },
  suggestBtn: {
    width: 44,
    height: 44,
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
    backgroundColor: COLORS.bg.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
