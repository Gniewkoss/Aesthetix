import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { ChatMessage, PhysiqueAnalysis } from '../types';
import { callChatMessage, buildChatSystemContext, getWelcomeMessage } from '../api/chat';

const chatKey = (analysisId: string) => `@physiquemax/chat:${analysisId}`;

async function loadPersistedMessages(analysisId: string): Promise<ChatMessage[] | null> {
  try {
    const raw = await AsyncStorage.getItem(chatKey(analysisId));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : null;
  } catch {
    return null;
  }
}

function persistMessages(analysisId: string, messages: ChatMessage[]): void {
  AsyncStorage.setItem(chatKey(analysisId), JSON.stringify(messages)).catch(() => {});
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentAnalysisId: string | null;

  initForAnalysis: (analysis: PhysiqueAnalysis) => Promise<void>;
  sendMessage: (text: string, analysis: PhysiqueAnalysis) => Promise<void>;
  clearMessages: (analysisId?: string) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  currentAnalysisId: null,

  initForAnalysis: async (analysis: PhysiqueAnalysis) => {
    if (get().currentAnalysisId === analysis.id) return;

    // Reset first so the UI doesn't show stale messages while loading
    set({ messages: [], currentAnalysisId: analysis.id, error: null });

    const saved = await loadPersistedMessages(analysis.id);
    if (saved && saved.length > 0) {
      set({ messages: saved });
      return;
    }

    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(analysis),
      timestamp: new Date().toISOString(),
    };
    set({ messages: [welcome] });
  },

  sendMessage: async (text: string, analysis: PhysiqueAnalysis) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const systemContext = buildChatSystemContext(analysis);
      const history = get()
        .messages.filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const responseText = await callChatMessage(history, systemContext);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      const nextMessages = [...get().messages, assistantMessage];
      set({ messages: nextMessages, isLoading: false });
      persistMessages(analysis.id, nextMessages);
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to get response. Try again.',
      });
    }
  },

  clearMessages: async (analysisId?: string) => {
    const id = analysisId ?? get().currentAnalysisId;
    if (id) {
      await AsyncStorage.removeItem(chatKey(id)).catch(() => {});
    }
    set({ messages: [], currentAnalysisId: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
