import { useChatStore } from "@/store/ChatStore";
import Image from "next/image";
import React, { useState } from "react";

const ChatForm = () => {
  const [inputValue, setInputValue] = useState("");
  const { setMessages, setIsThinking } = useChatStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValue.trim()) {
      setMessages({
        sender: "user",
        message: inputValue.trim(),
      });

      setIsThinking(true);
      setTimeout(() => {
        setMessages({
          sender: "bot",
          message: "Dziękuję za wiadomość! Jak mogę pomóc?",
        });
        setIsThinking(false);
      }, 2500);

      setInputValue("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-2 bg-white"
    >
      <div className="flex">
        <input
          type="text"
          placeholder="Zadaj pytanie..."
          className="w-full p-2 shadow-inner shadow-black/15 border border-black/5 bg-slate-50 rounded-md"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button
          type="submit"
          className="bg-purple-chat hover:bg-purple-chat/90 transition-all duration-200 rounded-xl p-2 ml-3 w-10 h-10"
        >
          <Image
            src="/send_white.png"
            alt="icon"
            width={50}
            height={50}
            className="w-5 h-5 object-contain"
          />
        </button>
      </div>
    </form>
  );
};

export default ChatForm;
