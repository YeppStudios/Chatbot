"use client";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import "./globals.css";
import ChatWindow from "@/components/Chat/ChatWindow";
import OpenChatButton from "@/components/Chat/OpenChatButton";

class ChatBotElement extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const mountPoint = document.createElement("div");
    shadow.appendChild(mountPoint);

    const root = createRoot(mountPoint);
    root.render(<ChatEmbed />);
  }
}

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

customElements.define("chat-bot", ChatBotElement);