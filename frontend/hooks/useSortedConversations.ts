import { Conversation } from "@/types";
interface useSortedConversationsProps {
  sortType: string;
  conversations: Conversation[];
}

const useSortedConversations = ({
  conversations,
  sortType,
}: useSortedConversationsProps) => {
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
};

export default useSortedConversations;
