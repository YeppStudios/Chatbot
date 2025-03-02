"use client";
import { useState } from "react";
import OpenChatButton from "./OpenChatButton";
import ChatWindow from "./ChatWindow";
import useConversation from "@/hooks/useConversation";

const Index = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { conversationId, messages, saveMessage } = useConversation({ isOpen });

  return (
    <div>
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};
export default Index;
