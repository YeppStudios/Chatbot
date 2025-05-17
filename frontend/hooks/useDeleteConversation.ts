import { useState } from "react";
import { deleteConversation } from "@/utils/deleteConversation";
import { getAuthToken } from "@/utils/auth/getToken";
import useConversationStore from "@/store/useConversationStore";

const useDeleteConversation = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const triggerRefetch = useConversationStore((state) => state.triggerRefetch);

  const handleDelete = async (conversationId: string) => {
    setIsDeleting(true);
    setError(null);
    setSuccess(false);

    const authToken = getAuthToken();
    if (!authToken) {
      setError("No token available");
      setIsDeleting(false);
      return false;
    }

    try {
      const result = await deleteConversation(conversationId, authToken);
      setSuccess(result);

      if (result) {
        triggerRefetch(conversationId);
      }

      return result;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      setError(error);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteConversation: handleDelete,
    isDeleting,
    error,
    success,
  };
};

export default useDeleteConversation;
