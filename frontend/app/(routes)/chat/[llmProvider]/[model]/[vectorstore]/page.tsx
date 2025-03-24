"use client";
import { useState, useEffect } from "react";
import OpenChatButton from "./OpenChatButton";
import ChatWindow from "./ChatWindow";

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Send size update to parent window
    const message = {
      type: "resize",
      width: isOpen ? 450 : 60, // ChatWindow width or button width
      height: isOpen ? 614 : 60, // ChatWindow height + button + spacing or button height
    };
    window.parent.postMessage(message, "*");
  }, [isOpen]);

  return (
    <div
      className={`fixed bottom-0 right-0 ${
        isOpen ? "w-[475px] h-[640px]" : "w-[60px] h-[60px]"
      }`}
    >
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};

export default Chat;