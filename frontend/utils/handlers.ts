import { RepeatType } from "@/app/types";
import { heygen_API } from "@/config/apiConfig";


export const repeatHandler = async ({
  sessionInfo,
  taskInput,
}: {
  sessionInfo: any;
  taskInput: any;
}) => {
  const text = taskInput;
  const repeatData = await repeat({
    session_id: sessionInfo.id,
    text,
  });
  return repeatData;
};

const repeat = async ({ session_id, text }: RepeatType) => {
  const response = await fetch(`https://api.heygen.com/v1/streaming.task`, {
    method: "POST",
    headers: {
      Accept: "application/json'",
      "Content-Type": "application/json",
      "X-Api-Key": heygen_API.apiKey,
    },
    body: JSON.stringify({ session_id, text }),
  });
  if (response.status === 500) {
    console.error("Server error");
    throw new Error("Server error");
  } else {
    const data = await response.json();
    return data.data;
  }
};
