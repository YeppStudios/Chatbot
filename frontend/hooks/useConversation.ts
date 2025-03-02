import { backend } from "@/config/apiConfig";
import { useEffect, useState } from "react";

const useConversation = ({ isOpen }: { isOpen: boolean }) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState<{ text: string; role: string }[]>(
    []
  );

  useEffect(() => {
    if (isOpen && !conversationId) {
      createNewConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && conversationId) {
      setConversationId(null);
      setMessages([]);
    }
  }, [isOpen]);

  const createNewConversation = async () => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const response = await fetch(`${backend.serverUrl}/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "67bf0b49a94c6fad5145777c",
          assistantId: "asst_x6MKYmAnK0IPjMSRp0dafCwF",
          title: `${currentDate} conversation`,
        }),
      });
      console.log(response, "response");
      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      setConversationId(data.id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const saveMessage = async (message: { text: string; role: string }) => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/conversation/${conversationId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message.text,
          role: message.role,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save message");
      }

      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  return { conversationId, messages, saveMessage };
};
export default useConversation;
