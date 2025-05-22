import { backend } from "@/config/apiConfig";

export const getConversation = async (conversationId: string) => {
  try {
    const conversationResponse = await fetch(
      `${backend.serverUrl}/conversation/${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!conversationResponse.ok) {
      // Handle specific error cases
      if (conversationResponse.status === 404) {
        console.warn("Conversation not found or has no messages");
        return null;
      }
      
      throw new Error(`Failed to fetch conversation: ${conversationResponse.status}`);
    }

    const data = await conversationResponse.json();
    
    // Return the entire conversation with messages
    return data;
  } catch (e) {
    console.error("Error fetching conversation:", e);
    return null;
  }
};