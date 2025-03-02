"use client";

import { motion, AnimatePresence } from "framer-motion";
import MessagesList from "./MessagesList";
import ChatForm from "./ChatForm";
import { useEffect } from "react";
import { useChatStore } from "@/store/ChatStore";
import { createNewConversation } from "@/utils/createConversation";
import { assistantId, greetingMessage, userId } from "@/constants/chatbot";

const ChatWindow = ({ isOpen }: { isOpen: boolean }) => {
  const { resetChatState, setThreadId } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      // 1) Reset local chat store
      resetChatState();
  
      useChatStore.setState((state) => ({
        messages: [
          ...state.messages,
          {
            id: `conversation-${Date.now()}`,
            text: greetingMessage,
            sender: "Assistant",
            typed: true,
          },
        ],
      }));
  
      createNewConversation({ userId, assistantId })
        .then(({ thread }) => {
          setThreadId(thread.id);
        })
        .catch((err) => console.error("Failed to create conversation:", err));
    }
  }, [isOpen, resetChatState, setThreadId]);
  

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
          {/* Wrapper for scrollable messages & fixed fades */}
          <div className="relative" style={{ height: "calc(100% - 60px)" }}>
            {/* Scrollable messages area */}
            <div className="h-full hide-scrollbar">
              <MessagesList />
            </div>

            {/* Top fade overlay */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10" />

            {/* Bottom fade overlay */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10" />
          </div>

          {/* Chat form pinned at the bottom */}
          <ChatForm />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;
