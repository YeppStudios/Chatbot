// ChatStore.ts

import { create } from "zustand";
import { backend } from "@/config/apiConfig";
import { assistantId, greetingMessage, userId } from "@/constants/chatbot";

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
  isCreatingConversation: boolean;
  
  setIsThinking: (value: boolean) => void;
  setIsStreaming: (value: boolean) => void;
  setThreadId: (value: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updatedContent: Partial<Message>) => void;
  clearMessages: () => void;
  resetChatState: () => void;
  createNewConversation: () => Promise<any>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isThinking: false,
  isStreaming: false,
  threadId: null,
  isCreatingConversation: false,

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

  resetChatState: () =>
    set({
      messages: [],
      isThinking: false,
      isStreaming: false,
      threadId: null,
      isCreatingConversation: false,
    }),
    
  createNewConversation: async () => {
    // Prevent duplicate creation
    if (get().isCreatingConversation || get().threadId) return;
    
    set({ isCreatingConversation: true });
    
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const response = await fetch(`${backend.serverUrl}/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          assistantId,
          title: `${currentDate} conversation`,
          text: greetingMessage, // Include greeting message in the initial creation
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      
      set({ 
        threadId: data.thread.id,
        isCreatingConversation: false,
        messages: [
          ...get().messages,
          {
            id: `conversation-${Date.now()}`,
            text: greetingMessage,
            sender: "Assistant",
            typed: true,
          },
        ]
      });
      
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      set({ isCreatingConversation: false });
      throw error;
    }
  }
}));