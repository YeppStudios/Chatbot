"use client";
import ChatWindow from "@/components/Chat/ChatWindow";
import OpenChatButton from "@/components/Chat/OpenChatButton";
import { useState } from "react";

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`fixed bottom-5 right-5 ${
        isOpen ? "w-[450px] h-[614px]" : "w-[60px] h-[60px]"
      }`}
    >
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};

export default Chat;