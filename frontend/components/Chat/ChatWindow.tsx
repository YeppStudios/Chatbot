"use client";

import { motion, AnimatePresence } from "framer-motion";
import MessagesList from "./MessagesList";
import ChatForm from "./ChatForm";
import { useEffect } from "react";
import { useChatStore } from "@/store/ChatStore";
import { usePathname, useParams } from "next/navigation";
import { X } from "lucide-react";
import Image from "next/image";

const ChatWindow = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
      createNewConversation(isOpenAIRoute)
        .catch((err) => console.error("Failed to create conversation:", err));
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full sm:h-[85vh] h-[95vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { stiffness: 300, damping: 25 } }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          >
            {/* Header with logo, company name, and close button */}
            <div className="flex items-center justify-between px-2 sm:px-6 py-2 sm:py-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-8 rounded-md bg-primary flex items-center justify-center">
                  {/* Logo image */}
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={256}
                    height={256}
                    className="object-contain"
                  />
                </div>
                <h2 className="text-lg">Metrum Cyroflex AI</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message list container with scrollable area */}
            <div className="flex-1 relative overflow-hidden px-4 py-8">
              <div className="absolute inset-0 px-4 py-8 max-w-4xl mx-auto">
                <MessagesList />
              </div>
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10" />
            </div>
            
            {/* Input container that can expand independently */}
            <div className="z-20 border-t p-2 sm:p-2 sm:py-2">
              <div className="max-w-4xl mx-auto">
                <ChatForm />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;