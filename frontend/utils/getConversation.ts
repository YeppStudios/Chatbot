import { backend } from "@/config/apiConfig";

export const getConversation = async (threadId: string) => {
  try {
    const conversationResponse = await fetch(
      `${backend.serverUrl}/conversation/${threadId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await conversationResponse.json();
    return data;
  } catch (e) {
    console.log(e);
  }
};



