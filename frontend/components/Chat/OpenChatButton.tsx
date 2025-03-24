// components/OpenChatButton.tsx
"use client";
import { X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const OpenChatButton = ({
  setIsOpen,
  isOpen,
}: {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
}) => {
  const enableIframeInteraction = () => {
    window.parent.postMessage({ type: "enableInteraction" }, "*");
  };

  const disableIframeInteraction = () => {
    window.parent.postMessage({ type: "disableInteraction" }, "*");
  };

  return (
    <motion.div
      onClick={() => setIsOpen((prev) => !prev)}
      onMouseEnter={enableIframeInteraction} // Enable on hover
      onMouseLeave={disableIframeInteraction} // Disable when leaving
      className="fixed bottom-5 right-5 cursor-pointer pointer-events-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close-button"
            className="bg-purple-chat rounded-md p-[2px]"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="text-white w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="chat-icon"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Image
              src="/chatIcon.webp"
              width={60}
              height={60}
              alt="Chat bot icon"
              className="rounded-t-2xl rounded-bl-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OpenChatButton;