import { Conversation } from "@/types";
import { useMemo } from "react";

interface useSortedConversationsProps {
  sortType: string;
  conversations: Conversation[] | null | undefined;
}

const useSortedConversations = ({
  conversations,
  sortType,
}: useSortedConversationsProps) => {
  return useMemo(() => {
    // Check if conversations is an array
    if (!Array.isArray(conversations)) {
      return [];
    }
    
    // Handle empty array
    if (conversations.length === 0) {
      return [];
    }

    const sorted = [...conversations].sort((a, b) => {
      switch (sortType) {
        case "latest":
          return (
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
          );
        case "most":
          return 0;
        case "least":
          return 0;
        default:
          return 0;
      }
    });

    return sorted;
  }, [conversations, sortType]);
};

export default useSortedConversations;