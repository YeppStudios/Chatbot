// app/chat/[model]/[dbProvider]/page.tsx
"use client";

import { useParams } from "next/navigation";
import ChatWindow from "@/components/Chat/ChatWindow"; // Adjust path as needed
import OpenChatButton from "@/components/Chat/OpenChatButton"; // Adjust path as needed
import { useState } from "react";

export default function ChatPage() {
  const { llmProvider, model, vectorstore } = useParams(); // Extract dynamic params
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <h1>
        Chat with {llmProvider} {model} using {vectorstore}
      </h1>
      <ChatWindow isOpen={isOpen} />
      <OpenChatButton setIsOpen={setIsOpen} isOpen={isOpen} />
    </div>
  );
}