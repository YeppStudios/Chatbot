import { motion, AnimatePresence } from "framer-motion";
import MessagesList from "./MessagesList";
import ChatForm from "./ChatForm";

const ChatWindow = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-14 px-2 pt-4 right-5 bg-white border-gray-100 border-2 rounded-2xl shadow-lg overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
              type: "",
              stiffness: 300,
              damping: 25,
            },
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: 20,
            transition: { duration: 0.2 },
          }}
          style={{
            width: "450px",
            height: "550px",
            transformOrigin: "bottom right",
          }}
        >
          <MessagesList />
          <ChatForm />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;