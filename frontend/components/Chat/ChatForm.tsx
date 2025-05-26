"use client";

import Image from "next/image";
import React, { useState, useRef, FormEvent, useEffect } from "react";
import { useChatStore } from "@/store/ChatStore";
import useSendAssistantMessage from "@/hooks/useSendAssistantMessage";
import useSendLLMMessage from "@/hooks/useSendLLMMessage";
import { usePathname } from "next/navigation";

const ChatForm = () => {
  const [inputValue, setInputValue] = useState("");
  const pathname = usePathname();
  const isOpenAIRoute = pathname === "/";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(40);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const {
    messages,
    isThinking,
    isStreaming,
    setIsThinking,
    setIsStreaming,
    threadId,
    conversationId,
  } = useChatStore();

  const toolActionRef = useRef([]);
  const setToolAction = (action: any) => {
    toolActionRef.current = action;
  };

  const setMessages = (updater: any) => {
    useChatStore.setState((state) => ({
      messages: typeof updater === "function" ? updater(state.messages) : updater,
    }));
  };

  const sendMessageOpenAI = useSendAssistantMessage({
    input: inputValue,
    setMessages,
    setInput: setInputValue,
    setAiThinking: setIsThinking,
    setIsStreaming,
    toolAction: toolActionRef.current,
    setToolAction,
  });

  const sendMessageLLM = useSendLLMMessage({
    input: inputValue,
    setMessages,
    setInput: setInputValue,
    setAiThinking: setIsThinking,
    setIsStreaming,
  });

  const sendMessage = isOpenAIRoute ? sendMessageOpenAI : sendMessageLLM;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    if (isOpenAIRoute && !threadId) {
      console.warn("No thread ID yet.");
      return;
    }
    if (!isOpenAIRoute && !conversationId) {
      console.warn("No conversation ID yet.");
      return;
    }
    sendMessage(e);
  };

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "40px";
      
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 120);
      
      // Set the height
      textareaRef.current.style.height = newHeight + "px";
      setTextareaHeight(newHeight);
    }
  }, [inputValue]);

  // Reset height after sending message
  useEffect(() => {
    if (inputValue === "" && textareaRef.current) {
      textareaRef.current.style.height = "40px";
      setTextareaHeight(40);
    }
  }, [inputValue]);

  // Handle Enter key to submit (with Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit} className="pt-2 px-1 sm:p-3 pb-1 bg-purple-50 rounded-lg">
        <div className="relative w-full mb-1">
          <textarea
            ref={textareaRef}
            placeholder="Ask question..."
            className="w-full p-2 shadow-inner outline-none shadow-black/15 border border-black/5 bg-white-50 rounded-lg resize-none min-h-10 overflow-y-auto"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ height: '40px', lineHeight: '24px', paddingTop: '8px', paddingBottom: '8px' }}
          />
        </div>
                <div className="flex items-center justify-between">
           {/* Info icon and text */}
           <div className="flex items-center gap-1 flex-1 relative sm:px-2 -mt-1">
             {/* Mobile: Info icon */}
             <button
               type="button"
               onClick={() => setIsInfoExpanded(!isInfoExpanded)}
               className="sm:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
               aria-label="Show full info"
             >
               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
               </svg>
             </button>
             
             {/* Desktop: Static text */}
             <span className="hidden sm:inline text-xs text-gray-400">
               Please note that this is a test version of the chatbot. Not all responses may be fully accurate yet.<br />If you notice any inconsistencies, please let us know to help improve this tool.
             </span>
             
             {/* Mobile: Clickable truncated text */}
             <button
               type="button"
               onClick={() => setIsInfoExpanded(!isInfoExpanded)}
               className="sm:hidden text-xs text-gray-400 hover:text-gray-600 transition-colors text-left truncate"
             >
               Please note that this is a test version...
             </button>
             
             {/* Mobile: Popup */}
             {isInfoExpanded && (
               <>
                 {/* Backdrop */}
                 <div 
                   className="fixed inset-0 z-40 sm:hidden"
                   onClick={() => setIsInfoExpanded(false)}
                 />
                 {/* Popup badge */}
                 <div className="absolute bottom-full left-0 mb-2 z-50 sm:hidden">
                   <div className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 shadow-sm">
                     <div className="max-w-xs text-left leading-relaxed">
                       Please note that this is a test version of the chatbot. Not all responses may be fully accurate yet. If you notice any inconsistencies, please let us know to help improve this tool.
                     </div>
                   </div>
                   {/* Arrow */}
                   <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200"></div>
                 </div>
               </>
             )}
           </div>
           
           <button
             type="submit"
             className="bg-purple-chat hover:bg-purple-chat/90 transition-all duration-200 rounded-lg p-2 ml-3 min-w-10 h-10 flex items-center justify-center"
             disabled={(isOpenAIRoute ? !threadId : !conversationId) || !inputValue.trim()}
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
    </div>
  );
};

export default ChatForm;