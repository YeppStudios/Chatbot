// store/ChatStore.tsx
import { create } from "zustand";
import { backend } from "@/config/apiConfig";
import { greetingMessage, userId } from "@/constants/chatbot";

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
  threadId: string | null; // For OpenAI Assistant
  conversationId: string | null; // For custom LLM
  isCreatingConversation: boolean;
  llmProvider: string | null;
  model: string | null;
  vectorstore: string | null;

  setIsThinking: (value: boolean) => void;
  setIsStreaming: (value: boolean) => void;
  setThreadId: (value: string | null) => void;
  setConversationId: (value: string | null) => void;
  setLlmProvider: (value: string) => void;
  setModel: (value: string) => void;
  setVectorstore: (value: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updatedContent: Partial<Message>) => void;
  clearMessages: () => void;
  resetChatState: () => void;
  createNewConversation: (isOpenAI?: boolean) => Promise<any>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isThinking: false,
  isStreaming: false,
  threadId: null,
  conversationId: null,
  isCreatingConversation: false,
  llmProvider: null,
  model: null,
  vectorstore: null,

  setIsThinking: (value) => set({ isThinking: value }),
  setIsStreaming: (value) => set({ isStreaming: value }),
  setThreadId: (value) => set({ threadId: value }),
  setConversationId: (value) => set({ conversationId: value }),
  setLlmProvider: (value) => set({ llmProvider: value }),
  setModel: (value) => set({ model: value }),
  setVectorstore: (value) => set({ vectorstore: value }),

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
      conversationId: null,
      isCreatingConversation: false,
      llmProvider: null,
      model: null,
      vectorstore: null,
    }),

    createNewConversation: async (isOpenAI = false) => {
      if (get().isCreatingConversation || (isOpenAI ? get().threadId : get().conversationId)) return;
    
      set({ isCreatingConversation: true });
    
      try {
        const currentDate = new Date().toISOString().split("T")[0];
        const payload = {
          userId,
          assistantId: isOpenAI ? "your-openai-assistant-id" : null,
          title: `${currentDate} conversation`,
          text: greetingMessage,
        };
    
        const response = await fetch(`${backend.serverUrl}/conversation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Server responded with ${response.status}:`, errorText);
          throw new Error(`Failed to create conversation: ${errorText}`);
        }
    
        const data = await response.json();
        const id = isOpenAI ? data.thread.id : data.conversation._id;
    
        set({
          [isOpenAI ? "threadId" : "conversationId"]: id,
          isCreatingConversation: false,
          messages: [
            ...get().messages,
            {
              id: `conversation-${Date.now()}`,
              text: greetingMessage,
              sender: "Assistant",
              typed: true,
            },
          ],
        });
    
        console.log("Conversation created successfully:", id);
        return data;
      } catch (error) {
        console.error("Error creating conversation:", error);
        set({ isCreatingConversation: false });
        throw error;
      }
    },
}));