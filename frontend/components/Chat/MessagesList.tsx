"use client";

import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useVisibilityScrolling } from "@/hooks/useVisibilityScrolling";
import { useChatStore } from "@/store/ChatStore";
import { cn } from "@/utils/cn";
import { useRef, useEffect } from "react";
import AiThinking from "./AiThinking";
import ReactMarkdown from "react-markdown";

const MessagesList = () => {
  const { messages, isThinking } = useChatStore();
  const messagesEndRef = useScrollToBottom([messages]);
  const containerRef = useRef<HTMLDivElement>(null);

  useVisibilityScrolling(messagesEndRef);

  // Ensure container scrolls to the bottom on initial render and when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className="flex flex-col h-full overflow-y-auto hide-scrollbar p-2 pb-12 pt-20 justify-end"
      >
        {/* Fade overlay at top */}
        <div className="absolute top-8 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        
        {/* Spacer that pushes content to the bottom */}
        <div className="flex-grow" />
        
        {/* Messages container */}
        <div className="flex flex-col">
          {messages.map((chat) =>
            chat.text === "" ? null : (
              <div
                className={cn(
                  "my-2 p-2 max-w-[95%]",
                  chat.sender === "You"
                    ? "bg-purple-chat px-3 rounded-b-xl rounded-tl-xl self-end text-white"
                    : "bg-purple-chat/15 px-3 rounded-b-xl rounded-tr-xl self-start text-gray-600"
                )}
                key={chat.id}
              >
                <ReactMarkdown>{chat.text}</ReactMarkdown>
              </div>
            )
          )}

          {isThinking && (
            <div className="my-2 self-start">
              <div className="px-4 py-4 bg-purple-chat/15 w-auto rounded-b-xl rounded-tr-xl text-gray-600 inline-block">
                <AiThinking />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Fade overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default MessagesList;