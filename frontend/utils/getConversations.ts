import { backend } from "@/config/apiConfig";

export const getConversations = async (
  page = 1,
  limit = 20,
  token: string | null
) => {
  if (!token) {
    console.error("Token is missing!");
    return [];
  }

  try {
    const response = await fetch(
      `${backend.serverUrl}/conversations?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched conversations:", data);
    return data.conversations;
  } catch (err) {
    console.error("Failed to fetch the conversations:", err);
    return [];
  }
};
