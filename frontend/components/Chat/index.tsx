"use client";
import { useState, useEffect } from "react";
import OpenChatButton from "./OpenChatButton";
import ChatWindow from "./ChatWindow";
import useConversation from "@/hooks/useConversation";

const Index = () => {
  const [isOpen, setIsOpen] = useState(false);

  useConversation({ isOpen });

  useEffect(() => {
    const openButton = document.querySelector("#open-button-chat");

    const handleOpenClick = function () {
      parent.postMessage(
        {
          type: "openButtonClicked",
          message: "openButton in iframe was clicked",
        },
        "*"
      );
    };

    if (openButton) {
      openButton.addEventListener("click", handleOpenClick);
    }

    return () => {
      if (openButton) openButton.removeEventListener("click", handleOpenClick);
    };
  });

  return (
    <div>
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};

export default Index;
