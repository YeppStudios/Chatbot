"use client";

import { useCallback, useRef, useEffect } from "react";
import { askAI } from "@/utils/askAi";

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
  toolAction,
  setToolAction,
  mediaElement,
  session,
}: any) => {
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

      while (
        (endIndex = jsonChunkBuffer.current.indexOf("}", startIndex)) !== -1
      ) {
        const possibleJson = jsonChunkBuffer.current.substring(0, endIndex + 1);

        try {
          const json = JSON.parse(possibleJson);
          // Remove the parsed JSON from the buffer
          jsonChunkBuffer.current = jsonChunkBuffer.current
            .substring(endIndex + 1)
            .trim();
          startIndex = 0;

          // Handle partial or completed text chunk
          if (json.type === "text" && json.data) {
            if (!isStreamingRef.current) {
              isStreamingRef.current = true;
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

            // If we receive any text chunk, we know the AI is already “speaking”
            setAiThinking(false);
          }

          // Handle function call, tool actions, etc. ...
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
                      functionCall: [
                        ...(msg.functionCall || []),
                        newFunctionCall,
                      ],
                    }
                  : msg
              )
            );
            setAiThinking(false);
          }

          if (json.type === "tool_action") {
            // ...
            setToolAction([
              {
                id: json.data[0].id,
                run_id: json.data[0].run_id,
                function: json.data[0].function,
              },
            ]);
            // ...
          }

          if (json.type === "tool_outputs") {
            // ...
          }
        } catch (error) {
          // Incomplete/partial JSON, keep accumulating
          startIndex = endIndex + 1;
        }
      }
    },
    [setMessages, setAiThinking, setToolAction]
  );

  const sendMessage = useCallback(
    async (e: any) => {
      e.preventDefault();

      // Create user message
      const userMessage = {
        id: Date.now().toString(),
        text: input,
        sender: "You",
      };

      // Add user message to store
      setMessages((messages: any) => [...messages, userMessage]);

      // Clear input, set "thinking" to true
      setInput("");
      setAiThinking(true);

      isStreamingRef.current = false;
      jsonChunkBuffer.current = "";
      responseBuffer.current = "";
      functionCallRef.current = [];

      try {
        const runId = toolAction[0]?.run_id || "";
        const callId = toolAction[0]?.id || "";

        const reader = await askAI(
          input,
          "gpt-4o",
          "thread_KPVZaOjDsx1DZgJd5iDwrDLV",
          true,
          "asst_x6MKYmAnK0IPjMSRp0dafCwF",
          runId,
          callId
        );

        if (mediaElement?.current) {
          mediaElement.current.muted = false;
        }

        if (!reader) {
          throw new Error("Stream reader not available");
        }

        // Create an "Assistant" message to stream into
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

        // Continuously read from the stream
        const read = () => {
          reader.read().then(({ done, value }: any) => {
            if (done) {
              // End of the stream
              currentMessageIdRef.current = null;
              isStreamingRef.current = false;
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
      }
    },
    [
      input,
      setMessages,
      setInput,
      setAiThinking,
      setToolAction,
      toolAction,
      mediaElement,
      processChunk
    ]
  );

  return sendMessage;
};

export default useSendMessage;
