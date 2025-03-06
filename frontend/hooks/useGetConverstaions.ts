import { getConversations } from "@/utils/getConversations";
import { useState, useEffect } from "react";
import { Conversation } from "@/types";
import { getAuthToken } from "@/utils/auth/getToken";
import useConversationStore from "@/store/useConversationStore";

interface props {
  token: string;
  currentPage: number;
}

const useGetConversations = ({ token, currentPage = 1 }: props) => {
  const [conversationsList, setConversationsList] = useState<Conversation[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [totalPages, setTotalPages] = useState(0);

  const shouldRefetch = useConversationStore((state) => state.shouldRefetch);
  const deletedConversationId = useConversationStore(
    (state) => state.deletedConversationId
  );
  const resetRefetchTrigger = useConversationStore(
    (state) => state.resetRefetchTrigger
  );

  const fetchConversations = async () => {
    setLoading(true);
    const authToken = getAuthToken();
    if (!authToken) {
      console.log("No token available, skipping conversation fetch");
      setLoading(false);
      return;
    }

    try {
      const { conversations, total } = await getConversations(
        currentPage,
        20,
        authToken
      );
      setTotalPages(total);
      setConversationsList(conversations);
      setError(null);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentPage, token]);

  useEffect(() => {
    if (shouldRefetch) {
      fetchConversations();
      resetRefetchTrigger();
    }
  }, [shouldRefetch]);

  useEffect(() => {
    if (deletedConversationId && conversationsList) {
      setConversationsList((prevList) =>
        prevList
          ? prevList.filter((conv) => conv._id !== deletedConversationId)
          : undefined
      );
    }
  }, [deletedConversationId]);

  return {
    conversationsList,
    loading,
    error,
    totalPages: Math.round(totalPages / 14),
  };
};

export default useGetConversations;
