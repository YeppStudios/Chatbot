import { backend } from "@/config/apiConfig";

export const deleteConversation = async (
  conversationId: string,
  token: string | null
) => {
  if (!token) {
    console.error("Token is missing!");
    return false;
  }

  try {
    const response = await fetch(
      `${backend.serverUrl}/conversation/${conversationId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to delete conversation ${conversationId}:`, err);
    return false;
  }
};
