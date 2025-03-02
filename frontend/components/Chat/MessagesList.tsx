"use client";

import React, { useEffect, useState } from "react";
import { useChatStore } from "@/store/ChatStore";
import ReactMarkdown from "react-markdown";
import AiThinking from "./AiThinking";
import useAutoScroll from "@/hooks/useAutoScroll";
import Typewriter from "./Typewriter";


const MessagesList = () => {
  const { messages, isThinking, isStreaming } = useChatStore();
  
  const { containerRef, isFollowingScroll, resetScrollFollow } = useAutoScroll({
    messages,
    isThinking,
    isStreaming
  });
  
  const showScrollIndicator = isStreaming && !isFollowingScroll;

  return (
    <div className="relative h-full w-full">
      <div 
        ref={containerRef} 
        className="p-4 pt-8 pb-8 overflow-y-auto h-full hide-scrollbar"
      >
        {messages.map((chat) =>
          // If this message has typed=true, use the Typewriter component
          chat.text ? (
            <div
              key={chat.id}
              className={
                chat.sender === "You"
                  ? "flex justify-end w-full my-2" 
                  : "flex justify-start w-full my-2"
              }
            >
              <div
                className={
                  chat.sender === "You"
                    ? "bg-purple-chat px-3 rounded-b-xl rounded-tl-xl text-white p-2 max-w-[90%]"
                    : "bg-purple-chat/15 px-3 rounded-b-xl rounded-tr-xl text-gray-600 p-2 max-w-[90%]"
                }
              >
                {chat.typed ? (
                  <Typewriter text={chat.text} />
                ) : (
                  <ReactMarkdown>{chat.text}</ReactMarkdown>
                )}
              </div>
            </div>
          ) : null
        )}

        {isThinking && (
          <div className="flex justify-start w-full my-2">
            <div className="bg-purple-chat/15 px-4 py-4 rounded-b-xl rounded-tr-xl text-gray-600">
              <AiThinking />
            </div>
          </div>
        )}
      </div>
      
      {showScrollIndicator && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                     bg-purple-chat/80 text-white text-xs py-1 px-3 
                     rounded-full opacity-80 cursor-pointer 
                     transition-opacity hover:opacity-100 shadow-md animate-pulse"
          onClick={resetScrollFollow}
        >
          New messages ↓
        </div>
      )}
    </div>
  );
};

export default MessagesList;
