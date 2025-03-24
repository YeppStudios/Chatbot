"use client";
import { motion, AnimatePresence } from "framer-motion";
import MessagesList from "./MessagesList";
import ChatForm from "./ChatForm";
import { useEffect } from "react";
import { useChatStore } from "@/store/ChatStore";
import { usePathname, useParams } from "next/navigation";

const ChatWindow = ({ isOpen }: { isOpen: boolean }) => {
  const {
    resetChatState,
    createNewConversation,
    setLlmProvider,
    setModel,
    setVectorstore,
  } = useChatStore();
  const pathname = usePathname();
  const isOpenAIRoute = pathname === "/";
  const { llmProvider, model, vectorstore } = useParams();

  useEffect(() => {
    if (isOpen) {
      resetChatState();
      if (!isOpenAIRoute) {
        setLlmProvider(llmProvider as string);
        setModel(model as string);
        setVectorstore(vectorstore as string);
      }
      createNewConversation(isOpenAIRoute).catch((err) =>
        console.error("Failed to create conversation:", err)
      );
    }
  }, [
    isOpen,
    resetChatState,
    createNewConversation,
    setLlmProvider,
    setModel,
    setVectorstore,
    isOpenAIRoute,
    llmProvider,
    model,
    vectorstore,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute bottom-14 right-0 w-[450px] h-[550px] bg-white overflow-hidden border-2 border-gray-100 rounded-2xl shadow-lg flex flex-col pointer-events-auto"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { stiffness: 300, damping: 25 } }}
          exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
          style={{ transformOrigin: "bottom right" }}
        >
          {/* Message list container */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0">
              <MessagesList />
            </div>
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10" />
          </div>

          {/* Input container */}
          <div className="z-20">
            <ChatForm />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;