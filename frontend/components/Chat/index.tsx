"use client";

import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import ChatMessage from "./ChatMessage";
import { cn } from "@/utils/cn";

interface FunctionCall {
  name: string;
  status: "queued" | "pending" | "completed";
  outputs: any;
  call_id: string | null;
}

interface Message {
  text: string;
  sender: string;
  functionCall?: FunctionCall[];
}

interface ChatType {
  messages: Message[];
  aiThinking: boolean;
  submitToolResponse?: any;
  toolAction: any;
}

const EmptyStateText = styled.div`
  position: absolute;
  left: 50%;
  top: 45%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
  display: none;
  text-align: center;
  font-weight: 300;
  width: 100%;
  padding: 0 5.5rem 0 5.5rem;
  @media (max-width: 640px) {
    display: block;
  }
`;

const Chat: React.FC<ChatType> = ({
  messages,
  aiThinking,
  submitToolResponse,
  toolAction,
}) => {
  const messagesEndRef = useRef<any>(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:bottom-28 w-full sm:w-auto right-0 sm:pr-6 flex justify-end items-end z-10"
      )}
    >
      <div
        ref={chatContainerRef}
        className="relative pb-10 sm:pb-0 px-4 sm:px-0 sm:pt-0 sm:rounded-2xl rounded-br-none sm:rounded-br-none h-[36svh] sm:h-[70vh] z-20 w-full sm:w-[25rem] md:w-[32rem] lg:w-[40rem]"
      >
        <GradientBackground />
        {messages.length === 0 && (
          <EmptyStateText>
            You can avatar questions or order your dishes.
          </EmptyStateText>
        )}
        <ScrollableContent className="flex flex-col h-full pt-10 pb-28 overflow-auto overscroll-y-contain hide-scrollbar">
          {messages
            .filter(
              (message) =>
                message.text.length > 0 ||
                (message.functionCall && message.functionCall[0]?.name)
            )
            .map((message, index) => (
              <ChatMessage
                key={index}
                submitToolResponse={submitToolResponse}
                message={message}
                loading={false}
                className="mb-4"
                animated={false}
                toolAction={toolAction}
              />
            ))}
          {aiThinking && (
            <ChatMessage
              message={{ text: "", sender: "Assistant" }}
              loading={aiThinking}
              className="mb-4"
              animated={true}
            />
          )}
          <div ref={messagesEndRef} />
        </ScrollableContent>
      </div>
    </div>
  );
};

export default Chat;

const ScrollableContent = styled.div`
  width: 100%;
  height: 100%;
  overflow-x: visible;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  @media (max-width: 800px) {
    -webkit-mask: linear-gradient(to top, black 65%, transparent) top / 100% 51%,
      linear-gradient(to bottom, black 90%, transparent) bottom/100% 50%,
      linear-gradient(to left, black, transparent) left / 100% 0%,
      linear-gradient(to right, black, transparent) right / 100% 0%;
    -webkit-mask-repeat: no-repeat;
    mask: linear-gradient(to top, black 65%, transparent) top / 100% 51%,
      linear-gradient(to bottom, black 90%, transparent) bottom/100% 50%,
      linear-gradient(to left, black, transparent) left / 100% 0%,
      linear-gradient(to right, black, transparent) right / 100% 0%;
    mask-repeat: no-repeat;
    background-color: transparent;
    padding: 1.5rem 0.15rem 2rem 0.15rem;
  }

  -webkit-mask: linear-gradient(to top, black 90%, transparent) top / 100% 51%,
    linear-gradient(to bottom, black 90%, transparent) bottom/100% 50%,
    linear-gradient(to left, black, transparent) left / 100% 0%,
    linear-gradient(to right, black, transparent) right / 100% 0%;
  -webkit-mask-repeat: no-repeat;
  mask: linear-gradient(to top, black 90%, transparent) top / 100% 51%,
    linear-gradient(to bottom, black 90%, transparent) bottom/100% 50%,
    linear-gradient(to left, black, transparent) left / 100% 0%,
    linear-gradient(to right, black, transparent) right / 100% 0%;
  mask-repeat: no-repeat;
  background-color: transparent;

  padding: 0.5rem 0.15rem 0.5rem 0.15rem;
`;

const GradientBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  @media (max-width: 800px) {
    background: rgb(12, 12, 12, 0.95);
  }
  z-index: -1;
  mask-image: linear-gradient(to top, black 86%, transparent);
  -webkit-mask-image: linear-gradient(to top, black 86%, transparent);
`;
