import { X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

const OpenChatButton = ({
  setIsOpen,
  isOpen,
}: {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
}) => {
  return (
    <motion.div
      id="open-button-chat"
      onClick={() => setIsOpen((prev) => !prev)}
      className={cn(
        "absolute bottom-0 right-0 cursor-pointer z-[60]",
        !isOpen && "-bottom-[30px] -right-[30px] md:bottom-0 md:right-0"
      )}
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
            className="bg-purple-chat rounded-full p-3 shadow-lg"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: "-10px",
              right: "-10px",
            }}
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
