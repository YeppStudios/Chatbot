const serverUrl = process.env.NEXT_PUBLIC_BACKEND_API_SERVER_URL;

export const submitToolResponse = async (
  runId: string,
  salesProcessId: string,
  toolOutputs: { tool_call_id: string; output: string }[]
) => {
  const payload = {
    thread_id: salesProcessId,
    run_id: runId,
    tool_outputs: toolOutputs,
  };

  try {
    const response = await fetch(`${serverUrl}/submit-tool-response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(
        `HTTP error! Status: ${response.status}, Details: ${errorText}`
      );
    }

    if (response.body instanceof ReadableStream) {
      return response.body.getReader();
    } else {
      throw new Error(
        "Expected a stream in the response but did not receive one."
      );
    }
  } catch (error) {
    console.error("Failed to send to AI:", error);
    throw error;
  }
};
