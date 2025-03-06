
import { create } from "zustand";

interface ConversationState {
  shouldRefetch: boolean;
  deletedConversationId: string | null;
  triggerRefetch: (conversationId: string) => void;
  resetRefetchTrigger: () => void;
}

const useConversationStore = create<ConversationState>((set) => ({
  shouldRefetch: false,
  deletedConversationId: null,
  triggerRefetch: (conversationId: string) =>
    set({
      shouldRefetch: true,
      deletedConversationId: conversationId,
    }),
  resetRefetchTrigger: () =>
    set({
      shouldRefetch: false,
      deletedConversationId: null,
    }),
}));

export default useConversationStore;
