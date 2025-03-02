
import { backend } from "@/config/apiConfig";
import { greetingMessage } from "@/constants/chatbot";

interface CreateConversationProps {
  userId: string;
  assistantId: string;
  title?: string; // Optional if your endpoint allows
}

export async function createNewConversation({
    userId,
    assistantId,
    title = "New Conversation",
  }: CreateConversationProps) {
    try {
      const response = await fetch(`${backend.serverUrl}/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, assistantId, title, text: greetingMessage }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }
  
      // The backend returns { thread, conversation }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }