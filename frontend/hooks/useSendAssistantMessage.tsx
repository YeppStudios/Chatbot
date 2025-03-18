// hooks/useSendAssistantMessage.tsx
"use client";

import { useCallback, useRef, useEffect } from "react";
import { askOpenaiAssistant } from "@/utils/askOpenaiAssistant";
import { useChatStore } from "@/store/ChatStore";
import { assistantId } from "@/constants/chatbot";

interface FunctionCall {
  name: string;
  status: "queued" | "pending" | "completed";
  outputs: any;
  call_id: string | null;
}

const useSendAssistantMessage = ({
  input,
  setMessages,
  setInput,
  setAiThinking,
  setIsStreaming,
  toolAction,
  setToolAction,
}: any) => {
  const { threadId } = useChatStore();

  const jsonChunkBuffer = useRef("");
  const responseBuffer = useRef("");
  const functionCallRef = useRef<FunctionCall[]>([]);
  const currentMessageIdRef = useRef<string | null>(null);
  const isStreamingRef = useRef(false);

  const processChunk = useCallback(
    (chunk: string) => {
      chunk = chunk.replace(/data: /g, "").trim();
      jsonChunkBuffer.current += chunk;

      let startIndex = 0;
      let endIndex;

      while ((endIndex = jsonChunkBuffer.current.indexOf("}", startIndex)) !== -1) {
        const possibleJson = jsonChunkBuffer.current.substring(0, endIndex + 1);

        try {
          const json = JSON.parse(possibleJson);
          jsonChunkBuffer.current = jsonChunkBuffer.current.substring(endIndex + 1).trim();
          startIndex = 0;

          if (json.type === "text" && json.data) {
            if (!isStreamingRef.current) {
              isStreamingRef.current = true;
              setIsStreaming(true);
            }
            responseBuffer.current += json.data;

            setMessages((prevMessages: any) =>
              prevMessages.map((msg: any) =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, text: msg.text + json.data }
                  : msg
              )
            );
            setAiThinking(false);
          }

          if (json.type === "function_call") {
            const newFunctionCall: FunctionCall = {
              name: json.data.name,
              status: "queued",
              outputs: null,
              call_id: null,
            };
            functionCallRef.current.push(newFunctionCall);

            setMessages((prevMessages: any) =>
              prevMessages.map((msg: any) =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, functionCall: [...(msg.functionCall || []), newFunctionCall] }
                  : msg
              )
            );
            setAiThinking(false);
          }

          if (json.type === "tool_action") {
            setToolAction([
              {
                id: json.data[0].id,
                run_id: json.data[0].run_id,
                function: json.data[0].function,
              },
            ]);
          }
        } catch (error) {
          startIndex = endIndex + 1;
        }
      }
    },
    [setMessages, setAiThinking, setIsStreaming, setToolAction]
  );

  const sendMessage = useCallback(
    async (e: any) => {
      e.preventDefault();

      if (!threadId) {
        console.error("No threadId found.");
        return;
      }

      const userMessage = { id: Date.now().toString(), text: input, sender: "You" };
      setMessages((messages: any) => [...messages, userMessage]);

      setInput("");
      setAiThinking(true);
      isStreamingRef.current = false;
      setIsStreaming(false);
      jsonChunkBuffer.current = "";
      responseBuffer.current = "";
      functionCallRef.current = [];

      try {
        const runId = toolAction[0]?.run_id || "";
        const callId = toolAction[0]?.id || "";

        const reader = await askOpenaiAssistant(
          input,
          "gpt-4-turbo",
          threadId,
          true,
          assistantId,
          runId,
          callId
        );

        if (!reader) {
          throw new Error("Stream reader not available");
        }

        const assistantMessageId = Date.now().toString();
        currentMessageIdRef.current = assistantMessageId;
        setMessages((messages: any) => [
          ...messages,
          { id: assistantMessageId, text: "", sender: "Assistant", functionCall: [] },
        ]);

        const read = () => {
          reader.read().then(({ done, value }: any) => {
            if (done) {
              currentMessageIdRef.current = null;
              isStreamingRef.current = false;
              setIsStreaming(false);
              setAiThinking(false);
              return;
            }

            const textChunk = new TextDecoder().decode(value);
            processChunk(textChunk);
            read();
          });
        };
        read();
      } catch (error) {
        console.error("Failed to send to AI:", error);
        setAiThinking(false);
        setIsStreaming(false);
      }
    },
    [
      input,
      setMessages,
      setInput,
      setAiThinking,
      setIsStreaming,
      setToolAction,
      toolAction,
      processChunk,
      threadId,
    ]
  );

  return sendMessage;
};

export default useSendAssistantMessage;