// components/Chat/ChatForm.tsx
"use client";

import Image from "next/image";
import React, { useState, useRef, FormEvent } from "react";
import { useChatStore } from "@/store/ChatStore";
import useSendAssistantMessage from "@/hooks/useSendAssistantMessage";
import useSendLLMMessage from "@/hooks/useSendLLMMessage";
import { usePathname } from "next/navigation";

const ChatForm = () => {
  const [inputValue, setInputValue] = useState("");
  const pathname = usePathname();
  const isOpenAIRoute = pathname === "/";

  const {
    messages,
    isThinking,
    isStreaming,
    setIsThinking,
    setIsStreaming,
    threadId,
    conversationId,
  } = useChatStore();

  const toolActionRef = useRef([]);
  const setToolAction = (action: any) => {
    toolActionRef.current = action;
  };

  const setMessages = (updater: any) => {
    useChatStore.setState((state) => ({
      messages: typeof updater === "function" ? updater(state.messages) : updater,
    }));
  };

  const sendMessageOpenAI = useSendAssistantMessage({
    input: inputValue,
    setMessages,
    setInput: setInputValue,
    setAiThinking: setIsThinking,
    setIsStreaming,
    toolAction: toolActionRef.current,
    setToolAction,
  });

  const sendMessageLLM = useSendLLMMessage({
    input: inputValue,
    setMessages,
    setInput: setInputValue,
    setAiThinking: setIsThinking,
    setIsStreaming,
  });

  const sendMessage = isOpenAIRoute ? sendMessageOpenAI : sendMessageLLM;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isOpenAIRoute && !threadId) {
      console.warn("No thread ID yet.");
      return;
    }
    if (!isOpenAIRoute && !conversationId) {
      console.warn("No conversation ID yet.");
      return;
    }
    sendMessage(e);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-2 rounded-xl bg-white">
      <div className="flex">
        <input
          type="text"
          placeholder="Zadaj pytanie..."
          className="w-full p-2 shadow-inner outline-none shadow-black/15 border border-black/5 bg-slate-50 rounded-lg"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button
          type="submit"
          className="bg-purple-chat hover:bg-purple-chat/90 transition-all duration-200 rounded-lg p-2 ml-3 min-w-10 h-10 flex items-center justify-center"
          disabled={isOpenAIRoute ? !threadId : !conversationId}
        >
          <Image
            src="/send_white.png"
            alt="icon"
            width={50}
            height={50}
            className="w-5 h-5 object-contain"
          />
        </button>
      </div>
    </form>
  );
};

export default ChatForm;