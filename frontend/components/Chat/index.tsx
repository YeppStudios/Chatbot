"use client";
import { useState, useEffect } from "react";
import OpenChatButton from "./OpenChatButton";
import ChatWindow from "./ChatWindow";
import { cn } from "@/utils/cn";

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };


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
    <div
    className={`fixed bottom-5 right-5 ${
      isOpen ? "w-auto h-auto" : "w-[60px] h-[60px]"
    }`}
    >
      <ChatWindow isOpen={isOpen} onClose={handleClose} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};

export default Chat;
