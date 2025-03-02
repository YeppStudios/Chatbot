"use client";

import { useCallback, useRef, useEffect } from "react";
import { askAI } from "@/utils/askAi";
import { useChatStore } from "@/store/ChatStore";
import { assistantId } from "@/constants/chatbot";

interface FunctionCall {
  name: string;
  status: "queued" | "pending" | "completed";
  outputs: any;
  call_id: string | null;
}

const useSendMessage = ({
  input,
  setMessages,
  setInput,
  setAiThinking,
  setIsStreaming, // New prop for tracking streaming state
  toolAction,
  setToolAction,
  mediaElement,
  session,
}: any) => {
  // Retrieve the conversation's threadId from ChatStore
  const threadId = useChatStore((state) => state.threadId);

  const jsonChunkBuffer = useRef("");
  const responseBuffer = useRef("");
  const functionCallRef = useRef<FunctionCall[]>([]);
  const currentMessageIdRef = useRef<string | null>(null);
  const isStreamingRef = useRef(false);

  // Store the latest session in a ref if you need to re-use it
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const processChunk = useCallback(
    (chunk: string) => {
      // Remove any SSE prefix ("data: ") and accumulate
      chunk = chunk.replace(/data: /g, "").trim();
      jsonChunkBuffer.current += chunk;

      let startIndex = 0;
      let endIndex;

      while ((endIndex = jsonChunkBuffer.current.indexOf("}", startIndex)) !== -1) {
        const possibleJson = jsonChunkBuffer.current.substring(0, endIndex + 1);

        try {
          const json = JSON.parse(possibleJson);
          // Remove the parsed JSON from the buffer
          jsonChunkBuffer.current = jsonChunkBuffer.current.substring(endIndex + 1).trim();
          startIndex = 0;

          // Handle partial or completed text chunk
          if (json.type === "text" && json.data) {
            if (!isStreamingRef.current) {
              isStreamingRef.current = true;
              setIsStreaming(true);
            }
            responseBuffer.current += json.data;

            // Update the correct assistant message in the store
            setMessages((prevMessages: any) =>
              prevMessages.map((msg: any) =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, text: msg.text + json.data }
                  : msg
              )
            );
            setAiThinking(false);
          }

          // Handle function calls
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
                  ? {
                      ...msg,
                      functionCall: [...(msg.functionCall || []), newFunctionCall],
                    }
                  : msg
              )
            );
            setAiThinking(false);
          }

          // Handle tool actions
          if (json.type === "tool_action") {
            setToolAction([
              {
                id: json.data[0].id,
                run_id: json.data[0].run_id,
                function: json.data[0].function,
              },
            ]);
          }

          if (json.type === "tool_outputs") {
            // ... handle tool outputs if needed
          }
        } catch (error) {
          // Incomplete/partial JSON, keep accumulating
          startIndex = endIndex + 1;
        }
      }
    },
    [setMessages, setAiThinking, setIsStreaming, setToolAction]
  );

  const sendMessage = useCallback(
    async (e: any) => {
      e.preventDefault();

      // Create and add the user message
      const userMessage = {
        id: Date.now().toString(),
        text: input,
        sender: "You",
      };
      setMessages((messages: any) => [...messages, userMessage]);

      // Clear input and set thinking state
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

        if (!threadId) {
          console.error("No threadId found. Cannot send message to an uninitialized conversation.");
          return;
        }

        // Use the dynamic threadId from ChatStore
        const reader = await askAI(
          input,
          "gpt-4-turbo",
          threadId,
          true,
          assistantId,
          runId,
          callId
        );

        if (mediaElement?.current) {
          mediaElement.current.muted = false;
        }

        if (!reader) {
          throw new Error("Stream reader not available");
        }

        // Create an assistant message in the store to stream into
        const assistantMessageId = Date.now().toString();
        currentMessageIdRef.current = assistantMessageId;
        setMessages((messages: any) => [
          ...messages,
          {
            id: assistantMessageId,
            text: "",
            sender: "Assistant",
            functionCall: [],
          },
        ]);

        // Continuously read from the stream and process chunks
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
      mediaElement,
      processChunk,
      threadId,
    ]
  );

  return sendMessage;
};

export default useSendMessage;
