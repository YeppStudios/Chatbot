"use client";

import Image from "next/image";
import React, { useState, useRef } from "react";
import { useChatStore } from "@/store/ChatStore";
import useSendMessage from "@/hooks/useSendMessage";

const ChatForm = () => {
  const [inputValue, setInputValue] = useState("");
  const { messages, isThinking, setIsThinking } = useChatStore();

  // Use a ref for tool actions
  const toolActionRef = useRef([]);

  // Callback for setting new tool actions
  const setToolAction = (action: any) => {
    toolActionRef.current = action;
  };

  // A helper that updates Zustand’s messages by referencing the latest state
  const setMessages = (updater: any) => {
    useChatStore.setState((state) => {
      if (typeof updater === "function") {
        return { messages: updater(state.messages) };
      }
      return { messages: updater };
    });
  };

  // Our custom hook that returns the sendMessage function
  const sendMessage = useSendMessage({
    input: inputValue,
    setMessages,
    setInput: setInputValue,
    setAiThinking: setIsThinking,
    toolAction: toolActionRef.current,
    setToolAction,
    mediaElement: null,
    session: null,
  });

  return (
    <form onSubmit={sendMessage} className="border-t border-gray-200 p-2 bg-white">
      <div className="flex">
        <input
          type="text"
          placeholder="Zadaj pytanie..."
          className="w-full p-2 shadow-inner outline-none shadow-black/15 border border-black/5 bg-slate-50 rounded-md"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button
          type="submit"
          className="bg-purple-chat hover:bg-purple-chat/90 transition-all duration-200 rounded-xl p-2 ml-3 w-10 h-10"
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
