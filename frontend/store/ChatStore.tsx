import { create } from "zustand";

interface Message {
  sender: string;
  message: string;
}

interface ChatStore {
  messages: Message[];
  setMessages: (newMessage: Message) => void;
  isThinking: boolean;
  setIsThinking: (val: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  setMessages: (newMessage) =>
    set((state) => ({
      messages: [...state.messages, newMessage],
    })),
  isThinking: false,
  setIsThinking: (value) => set({ isThinking: value }),
}));
