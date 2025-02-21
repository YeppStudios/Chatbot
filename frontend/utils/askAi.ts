import { backend } from "@/config/apiConfig";

export const askAI = async (
  text: string,
  model: string,
  conversationId: string,
  stream = false,
  assistantId: string,
  runId?: string,
  callId?: string
) => {
  const payload = {
    question: text,
    model,
    threadId: conversationId,
    stream,
    assistantId,
    runId,
    callId,
  };

  try {
    const response = await fetch(`${backend.serverUrl}/askAI`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (stream) {
      if (response.body instanceof ReadableStream) {
        return response.body.getReader();
      } else {
        throw new Error(
          "Expected a stream in the response but did not receive one."
        );
      }
    } else {
      const data = await response.json();
      return data.response;
    }
  } catch (error) {
    console.error("Failed to send to AI:", error);
  }
};
