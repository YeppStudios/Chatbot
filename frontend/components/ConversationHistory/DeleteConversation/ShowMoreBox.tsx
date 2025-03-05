import { useClickOutside } from "@/hooks/useClickOutside";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDelete from "./ConfirmDelete";
import useDeleteConversation from "@/hooks/useDeleteConversation";
import { toast } from "react-hot-toast";

const ShowMoreBox = ({ conversationId }: { conversationId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null!);
  const buttonRef = useRef<HTMLButtonElement>(null!);
  const { deleteConversation, success } = useDeleteConversation();

  useClickOutside(dropdownRef, (event) => {
    if (
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  });

  // Track deletion success and show toast notification
  useEffect(() => {
    if (success) {
      toast.success("Conversation deleted successfully");
    }
  }, [success]);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleConfirmation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    deleteConversation(conversationId);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex justify-end sm:w-40 relative">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className="p-2 rounded-md hover:bg-black/10 transition-all duration-200"
        >
          <Image
            src="/more.png"
            alt=""
            height={0}
            width={0}
            className="w-3 sm:w-4 sm:h-4"
          />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              onClick={handleConfirmation}
              className="absolute whitespace-nowrap bg-white top-9 text-center rounded-md p-3 border w-full border-black/10 shadow-sm text-sm z-10"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              Delete Conversation
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ConfirmDelete
        confirmDelete={handleDelete}
        isOpen={showConfirmation}
        onOpen={setShowConfirmation}
      />
    </>
  );
};

export default ShowMoreBox;
