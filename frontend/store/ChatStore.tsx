// ChatStore.ts

import { create } from "zustand";

interface Message {
  typed: boolean;
  id: string;
  text: string;
  sender: "You" | "Assistant";
  functionCall?: any[];
}

interface ChatStore {
  messages: Message[];
  isThinking: boolean;
  isStreaming: boolean;
  threadId: string | null;
  
  setIsThinking: (value: boolean) => void;
  setIsStreaming: (value: boolean) => void;
  setThreadId: (value: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updatedContent: Partial<Message>) => void;
  clearMessages: () => void;

  // Add a convenience method to reset everything at once
  resetChatState: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isThinking: false,
  isStreaming: false,
  threadId: null,

  setIsThinking: (value) => set({ isThinking: value }),
  setIsStreaming: (value) => set({ isStreaming: value }),
  setThreadId: (value) => set({ threadId: value }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updatedContent) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updatedContent } : msg
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  // Resets everything
  resetChatState: () =>
    set({
      messages: [],
      isThinking: false,
      isStreaming: false,
      threadId: null,
    }),
}));
