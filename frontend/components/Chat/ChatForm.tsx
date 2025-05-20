"use client";

import Image from "next/image";
import React, { useState, useRef, FormEvent, useEffect } from "react";
import { useChatStore } from "@/store/ChatStore";
import useSendAssistantMessage from "@/hooks/useSendAssistantMessage";
import useSendLLMMessage from "@/hooks/useSendLLMMessage";
import { usePathname } from "next/navigation";

const ChatForm = () => {
  const [inputValue, setInputValue] = useState("");
  const pathname = usePathname();
  const isOpenAIRoute = pathname === "/";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(40);

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
    if (!inputValue.trim()) return;
    
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

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "40px";
      
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 120);
      
      // Set the height
      textareaRef.current.style.height = newHeight + "px";
      setTextareaHeight(newHeight);
    }
  }, [inputValue]);

  // Reset height after sending message
  useEffect(() => {
    if (inputValue === "" && textareaRef.current) {
      textareaRef.current.style.height = "40px";
      setTextareaHeight(40);
    }
  }, [inputValue]);

  // Handle Enter key to submit (with Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white">
      <form onSubmit={handleSubmit} className="pt-2 px-1 sm:px-3 pb-1">
        <div className="flex items-center">
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              placeholder="Zadaj pytanie..."
              className="w-full p-2 shadow-inner outline-none shadow-black/15 border border-black/5 bg-slate-50 rounded-lg resize-none min-h-10 overflow-y-auto"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ height: '40px', lineHeight: '24px', paddingTop: '8px', paddingBottom: '8px' }}
            />
          </div>
          <button
            type="submit"
            className="bg-purple-chat hover:bg-purple-chat/90 transition-all duration-200 rounded-lg p-2 ml-3 sm:ml-4 min-w-10 h-10 -mt-1.5 flex items-center justify-center"
            disabled={(isOpenAIRoute ? !threadId : !conversationId) || !inputValue.trim()}
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
    </div>
  );
};

export default ChatForm;