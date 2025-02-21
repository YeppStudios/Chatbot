import { create } from "zustand";

interface Message {
  id: string;
  text: string;
  sender: "You" | "Assistant";
  functionCall?: any[];
}

interface ChatStore {
  messages: Message[];
  isThinking: boolean;
  setIsThinking: (value: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isThinking: false,
  setIsThinking: (value) => set({ isThinking: value }),
}));