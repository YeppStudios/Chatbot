// ChatWindow.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import MessagesList from "./MessagesList";
import ChatForm from "./ChatForm";
import { useEffect } from "react";
import { useChatStore } from "@/store/ChatStore";

const ChatWindow = ({ isOpen }: { isOpen: boolean }) => {
  const { resetChatState, createNewConversation } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      resetChatState();
      createNewConversation()
        .catch((err) => console.error("Failed to create conversation:", err));
    }
  }, [isOpen, resetChatState, createNewConversation]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-14 right-5 w-[450px] h-[550px] bg-white border-2 border-gray-100 rounded-2xl shadow-lg flex flex-col"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { stiffness: 300, damping: 25 },
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: 20,
            transition: { duration: 0.2 },
          }}
          style={{ transformOrigin: "bottom right" }}
        >
          <div className="relative" style={{ height: "calc(100% - 60px)" }}>
            <div className="h-full hide-scrollbar">
              <MessagesList />
            </div>
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10" />
          </div>
          <ChatForm />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;