"use client";
import { useState } from "react";
import OpenChatButton from "./OpenChatButton";
import ChatWindow from "./ChatWindow";

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