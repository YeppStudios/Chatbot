"use client";

import React from "react";
import { useChatStore } from "@/store/ChatStore";
import ReactMarkdown from "react-markdown";
import AiThinking from "./AiThinking";
import useAutoScroll from "@/hooks/useAutoScroll";
import Typewriter from "./Typewriter";
import { Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';

// Define TypeScript interfaces
interface Attachment {
  file_id?: string;
  name?: string;
}

interface Message {
  id: string;
  sender: "You" | "AI" | "System";
  text?: string;
  typed?: boolean;
  attachments?: Attachment[];
  functionCall?: string;
}

interface User {
  name?: string;
  // Add other user properties if needed
}

// Add this interface if not already defined in your ChatStore
interface ChatStore {
  messages: Message[];
  isThinking: boolean;
  isStreaming: boolean;
  user?: User;
}

const MessagesList: React.FC = () => {
  const { messages, isThinking, isStreaming } = useChatStore() as ChatStore;
  
  const { containerRef, isFollowingScroll, resetScrollFollow } = useAutoScroll({
    messages,
    isThinking,
    isStreaming,
  });
  
  const showScrollIndicator = isStreaming && !isFollowingScroll;

  const formatMessage = (text: string): string => {
    // First handle numbered lists
    let formattedText = text?.replace(/(\d+)\./g, "$1\\.");
    
    // Ensure that headings have proper spacing
    formattedText = formattedText?.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');
    
    // Better handling of list items spacing
    formattedText = formattedText?.replace(/^(\s*[-*+]|\s*\d+\.)\s*(.+)$/gm, '$1 $2');
    
    return formattedText;
  };

  const truncateFilename = (filename: string): string => {
    if (filename.length <= 15) return filename;
    return `${filename.slice(0, 15)}...`;
  };

  const getDisplayFilename = (attachment: Attachment): string => {
    return attachment.name || attachment.file_id || 'Unnamed file';
  };

  const renderAttachments = (isUserMessage: boolean, attachments?: Attachment[]): React.ReactNode => {
    if (!attachments?.length) return null;

    return (
      <div className="mt-2 space-y-1 mb-2">
        <div className="text-sm flex items-center gap-1.5">
          <span>Referenced files:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => {
            const filename = getDisplayFilename(attachment);
            return (
              <div 
                key={attachment.file_id || filename}
                className={`cursor-pointer border shadow-sm rounded-md px-2.5 py-1 text-sm flex items-center gap-1.5 ${
                  isUserMessage 
                    ? "bg-purple-chat/80 text-white border-purple-chat/30" 
                    : "bg-purple-chat/10 text-gray-700 border-purple-chat/10"
                }`}
              >
                <Paperclip className="size-3.5" />
                <span title={filename}>
                  {truncateFilename(filename)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full">
      <div 
        ref={containerRef} 
        className="p-4 pt-6 pb-8 overflow-y-auto h-full hide-scrollbar"
      >
        {messages.map((message) => {
          const isUserMessage = message.sender === "You";
          const formattedMessage = formatMessage(message.text || '');
          
          return message.text ? (
            <div
              key={message.id}
              className={
                isUserMessage
                  ? "flex justify-end w-full my-4"
                  : "flex justify-start w-full my-4"
              }
            >
              <div
                className={
                  isUserMessage
                    ? "bg-purple-chat shadow-md px-3 py-1.5 rounded-b-xl rounded-tl-xl text-white max-w-[95%]"
                    : "bg-purple-chat/15 shadow-md px-3 py-1.5 rounded-b-xl rounded-tr-xl text-gray-700 max-w-[95%]"
                }
              >
                {message.typed ? (
                  <Typewriter text={message.text} isUserMessage={isUserMessage} />
                ) : (
                  <div className="prose prose-sm dark:prose-invert break-words" style={{ maxWidth: '100%' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-3 mb-1" {...props} />,
                        h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-2 mb-1" {...props} />,
                        p: ({ children }) => (
                          <p className="my-2 leading-relaxed whitespace-pre-line">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic">{children}</em>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className={
                            isUserMessage 
                              ? "border-l-4 border-white/30 pl-3 my-2 italic" 
                              : "border-l-4 border-purple-chat/30 pl-3 my-2 italic"
                          }>
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1">{children}</li>
                        ),
                        a: ({ href, children }) => (
                          <a 
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={
                              isUserMessage 
                                ? "text-blue-200 underline hover:text-blue-100" 
                                : "text-blue-600 underline hover:text-blue-800"
                            }
                          >
                            {children}
                          </a>
                        ),
                        hr: () => (
                          <hr className={
                            isUserMessage 
                              ? "border-white/20 my-4" 
                              : "border-gray-300 my-4"
                          } />
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-gray-300 rounded-md">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className={
                            isUserMessage 
                              ? "bg-purple-chat/40" 
                              : "bg-purple-chat/20"
                          }>
                            {children}
                          </thead>
                        ),
                        tbody: ({ children }) => (
                          <tbody>
                            {children}
                          </tbody>
                        ),
                        tr: ({ children }) => (
                          <tr className="border-b border-gray-300">
                            {children}
                          </tr>
                        ),
                        th: ({ children }) => (
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-300 px-4 py-2">
                            {children}
                          </td>
                        ),
                        code: ({ node, inline, className, children, ...props }: any) =>
                          inline ? (
                            <code
                              className={
                                isUserMessage 
                                  ? "bg-purple-chat/30 rounded px-1.5 py-0.5 font-mono text-sm" 
                                  : "bg-purple-chat/10 rounded px-1.5 py-0.5 font-mono text-sm"
                              }
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <pre className={
                              isUserMessage 
                                ? "bg-purple-chat/30 p-4 rounded-lg my-3 overflow-x-auto font-mono text-sm" 
                                : "bg-purple-chat/10 p-4 rounded-lg my-3 overflow-x-auto font-mono text-sm"
                              }
                            >
                              <code className={`language-${className?.replace('language-', '') || 'plaintext'}`} {...props}>
                                {children}
                              </code>
                            </pre>
                          ),
                      }}
                    >
                      {formattedMessage}
                    </ReactMarkdown>
                  </div>
                )}
                {message.functionCall && (
                  <p className="text-sm text-gray-300 mt-1">{message.functionCall}</p>
                )}
                {renderAttachments(isUserMessage, message.attachments)}
              </div>
            </div>
          ) : null;
        })}

        {isThinking && (
          <div className="flex justify-start w-full my-2">
            <div className="bg-purple-chat/15 px-3 py-4 rounded-b-xl rounded-tr-xl text-gray-600 shadow-sm">
              <AiThinking />
            </div>
          </div>
        )}
      </div>
      
      {showScrollIndicator && (
        <motion.div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                     bg-purple-chat/80 text-white text-xs py-1.5 px-4 
                     rounded-full opacity-80 cursor-pointer 
                     transition-opacity hover:opacity-100 shadow-md"
          onClick={resetScrollFollow}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 0.8, 
            y: 0,
            transition: {
              duration: 0.3
            }
          }}
          whileHover={{ 
            opacity: 1,
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
        >
          New messages ↓
        </motion.div>
      )}
    </div>
  );
};

export default MessagesList;