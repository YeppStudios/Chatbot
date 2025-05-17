"use client";
import { useState, useEffect } from "react";
import OpenChatButton from "./OpenChatButton";
import ChatWindow from "./ChatWindow";
import { cn } from "@/utils/cn";

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);

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
      className={cn("fixed bottom-5 right-5", {
        "w-[450px] h-[614px]": isOpen,
        "w-[60px] h-[60px]": !isOpen,
      })}
    >
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};

export default Chat;
