"use client";
import ChatWindow from "@/components/Chat/ChatWindow";
import OpenChatButton from "@/components/Chat/OpenChatButton";
import { useState, useEffect } from "react";

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    // Send size update to parent window
    const message = {
      type: "resize",
      width: isOpen ? window.innerWidth : 60, // Use full width when open
      height: isOpen ? window.innerHeight : 60, // Use full height when open
    };
    window.parent.postMessage(message, "*");
  }, [isOpen]);

  return (
    <div
      className={`fixed ${
        isOpen ? "bottom-5 right-5" : "bottom-0 right-0"
      } bottom-5 right-5 ${isOpen ? "w-auto h-auto" : "w-[100px] h-[100px]"}`}
    >
      <ChatWindow isOpen={isOpen} onClose={handleClose} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};

export default Chat;
