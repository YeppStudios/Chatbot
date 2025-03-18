"use client";

import { useCallback, useRef } from "react";
import { useChatStore } from "@/store/ChatStore";
import { askLlmConversation } from "@/utils/askLlmConversation";

const useSendLLMMessage = ({
  input,
  setMessages,
  setInput,
  setAiThinking,
  setIsStreaming,
}: any) => {
  const { conversationId, llmProvider, model, vectorstore } = useChatStore();

  const jsonChunkBuffer = useRef("");
  const responseBuffer = useRef("");
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

          if (json.type === "text") {
            const textContent = json.data || json.content || "";
            if (!isStreamingRef.current) {
              isStreamingRef.current = true;
              setIsStreaming(true);
            }
            responseBuffer.current += textContent;

            setMessages((prevMessages: any) =>
              prevMessages.map((msg: any) =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, text: msg.text + textContent }
                  : msg
              )
            );
            setAiThinking(false);
          } else if (json.type === "retrieving") {
            console.log("Retrieving:", json.content); // Log or handle in UI if needed
          } else if (json.type === "function_call") {
            const funcData = json.data || json; // Handle both formats
            const newFunctionCall = {
              name: funcData.name,
              status: "queued" as const,
              outputs: null,
              call_id: null,
            };
            setMessages((prevMessages: any) =>
              prevMessages.map((msg: any) =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, functionCall: [...(msg.functionCall || []), newFunctionCall] }
                  : msg
              )
            );
            setAiThinking(false);
          }
        } catch (error) {
          startIndex = endIndex + 1;
        }
      }
    },
    [setMessages, setAiThinking, setIsStreaming]
  );

  const sendMessage = useCallback(
    async (e: any) => {
      e.preventDefault();

      if (!conversationId || !llmProvider || !model || !vectorstore) {
        console.error("Missing conversationId, llmProvider, model, or vectorstore.");
        return;
      }

      const userMessage = { id: Date.now().toString(), text: input, sender: "You", typed: false };
      setMessages((messages: any) => [...messages, userMessage]);

      setInput("");
      setAiThinking(true);
      isStreamingRef.current = false;
      setIsStreaming(false);
      jsonChunkBuffer.current = "";
      responseBuffer.current = "";

      try {
        const reader = await askLlmConversation(
          input,
          conversationId,
          llmProvider,
          model,
          vectorstore,
          true
        );

        if (!reader) {
          throw new Error("Stream reader not available");
        }

        const assistantMessageId = Date.now().toString();
        currentMessageIdRef.current = assistantMessageId;
        setMessages((messages: any) => [
          ...messages,
          { id: assistantMessageId, text: "", sender: "Assistant", functionCall: [], typed: false },
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
        console.error("Failed to send to LLM:", error);
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
      processChunk,
      conversationId,
      llmProvider,
      model,
      vectorstore,
    ]
  );

  return sendMessage;
};

export default useSendLLMMessage;