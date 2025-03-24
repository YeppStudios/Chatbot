"use client";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import ChatWindow from "@/components/Chat/ChatWindow";
import OpenChatButton from "@/components/Chat/OpenChatButton";
import "./globals.css";

const ChatEmbed = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] ${
        isOpen ? "w-[450px] h-[614px]" : "w-[60px] h-[60px]"
      }`}
    >
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};

// Mount the component
const mountNode = document.createElement("div");
document.body.appendChild(mountNode);
const root = createRoot(mountNode);
root.render(<ChatEmbed />);