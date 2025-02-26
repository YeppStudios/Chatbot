"use client";

import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useVisibilityScrolling } from "@/hooks/useVisibilityScrolling";
import { useChatStore } from "@/store/ChatStore";
import { cn } from "@/utils/cn";
import { useRef } from "react";
import AiThinking from "./AiThinking";
import ReactMarkdown from "react-markdown"; // Import Markdown renderer

const MessagesList = () => {
  const { messages, isThinking } = useChatStore();
  const messagesEndRef = useScrollToBottom([messages]);
  const containerRef = useRef<HTMLDivElement>(null);

  useVisibilityScrolling(messagesEndRef);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full overflow-y-auto hide-scrollbar p-2"
    >
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
        <div className="w-11/12 my-2 px-2 py-4 bg-purple-chat/15 rounded-b-xl rounded-tr-xl self-start text-gray-600">
          <AiThinking />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;
