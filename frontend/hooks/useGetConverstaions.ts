import { getConversations } from "@/utils/getConversations";
import { useState, useEffect } from "react";
import { Conversation } from "@/types";
import { getAuthToken } from "@/utils/auth/getToken";
interface props {
  token: string;
  currentPage: number;
}

const useGetConversations = ({ token, currentPage = 1 }: props) => {
  const [conversationsList, setConversationsList] = useState<Conversation[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const authToken = getAuthToken();
      if (!authToken) {
        console.log("No token available, skipping conversation fetch");
        return;
      }

      try {
        const conversations = await getConversations(
          currentPage,
          20,
          authToken
        );
        setConversationsList(conversations);
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
