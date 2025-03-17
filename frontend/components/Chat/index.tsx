"use client";
import { useState } from "react";
import OpenChatButton from "./OpenChatButton";
import ChatWindow from "./ChatWindow";
const Index = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
};
export default Index;
