import { getConversations } from "@/utils/getConversations";
import { useState, useEffect } from "react";
import { Conversation } from "@/types";
interface props {
  token: string;
  currentPage: number;
}

const useGetConversations = ({ token, currentPage = 1 }: props) => {
  const [conversationsList, setConversationsList] =
    useState<Conversation[]>(dummyConversations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) {
        console.log("No token available, skipping conversation fetch");
        return;
      }

      try {
        setLoading(true);
        const conversations = await getConversations(currentPage, 20, token);
        setConversationsList(conversations.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentPage, token]);

  return {
    conversationsList,
    loading,
    error,
  };
};

export default useGetConversations;

const dummyConversations: Conversation[] = [
  {
    threadId: "thread-001",
    user: "john.doe@example.com",
    chatbot: "ChatBot",
    startTime: "2025-02-20T09:15:32Z",
    lastUpdated: "2025-02-20T09:45:12Z",
    title: "Lorem ipsum dolor sit amet",
  },
  {
    threadId: "thread-002",
    user: "jane.smith@example.com",
    chatbot: "ChatBot",
    startTime: "2025-02-21T14:23:45Z",
    lastUpdated: "2025-02-21T15:01:33Z",
    title: "Lorem ipsum consectetur adipiscing",
  },
  {
    threadId: "thread-003",
    user: "alex.johnson@example.com",
    chatbot: "ChatBot",
    startTime: "2025-02-22T11:05:17Z",
    lastUpdated: "2025-02-24T08:12:56Z",
    title: "Lorem ipsum elit sed do eiusmod",
  },
  {
    threadId: "thread-004",
    user: "sarah.williams@example.com",
    chatbot: "ChatBot",
    startTime: "2025-02-23T16:42:09Z",
    lastUpdated: "2025-02-23T17:15:22Z",
    title: "Lorem ipsum tempor incididunt",
  },
  {
    threadId: "thread-005",
    user: "michael.brown@example.com",
    chatbot: "ChatBot",
    startTime: "2025-02-24T10:30:00Z",
    lastUpdated: "2025-02-25T11:45:37Z",
    title: "Lorem ipsum ut labore et dolore",
  },
];
