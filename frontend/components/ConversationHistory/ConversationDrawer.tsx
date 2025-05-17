import React, {
  useEffect,
  useState,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import ReactMarkdown from "react-markdown";
import { MultiLineSkeletonLoader } from "../Loaders";
import { getConversation } from "@/utils/getConversation";
import { Sheet, SheetContent, SheetTitle } from "../ui/sheet";
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import { Paperclip } from "lucide-react";

interface ConversationDrawerProps {
  isDrawerOpen: boolean;
  handleDrawerClose: Dispatch<SetStateAction<boolean>>;
  conversationId: string | null;
}

interface MessageType {
  role: string;
  content: string;
  timestamp: string;
  attachments?: Array<{
    file_id?: string;
    name?: string;
  }>;
}

interface ConversationType {
  _id: string;
  threadId?: string;
  user: string;
  assistantId?: string;
  title: string;
  messages: MessageType[];
  startTime: string;
  lastUpdated: string;
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isDrawerOpen,
  handleDrawerClose,
  conversationId,
}) => {
  const [conversation, setConversation] = useState<ConversationType | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setLoading(true);
    const fetchConversation = async () => {
      if (conversationId) {
        const fetchedConversation = await getConversation(conversationId);
        setConversation(fetchedConversation);
      }
      setLoading(false);
    };

    if (isDrawerOpen) {
      fetchConversation();
    }
  }, [isDrawerOpen, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const formatMessage = (text: string): string => {
    // First handle numbered lists
    let formattedText = text?.replace(/(\d+)\./g, "$1\\.");
    
    // Ensure that headings have proper spacing
    formattedText = formattedText?.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');
    
    // Better handling of list items spacing
    formattedText = formattedText?.replace(/^(\s*[-*+]|\s*\d+\.)\s*(.+)$/gm, '$1 $2');
    
    return formattedText;
  };

  function removeCitations(text: string) {
    // This regex matches the pattern 【digits:digits†source】
    const citationRegex = /【\d+:\d+†source】/g;
    return text.replace(citationRegex, "");
  }

  // Handle case for OpenAI API response format (legacy/fallback)
  const isLegacyFormat = (message: any): boolean => {
    return message.content && Array.isArray(message.content) && message.content[0]?.text?.value;
  };

  // Extract content from either format
  const getMessageContent = (message: any): string => {
    if (isLegacyFormat(message)) {
      return message.content[0].text.value;
    }
    return message.content;
  };

  const truncateFilename = (filename: string): string => {
    if (filename.length <= 15) return filename;
    return `${filename.slice(0, 15)}...`;
  };

  const getDisplayFilename = (attachment: any): string => {
    return attachment.name || attachment.file_id || 'Unnamed file';
  };

  const renderAttachments = (isUserMessage: boolean, attachments?: any[]): React.ReactNode => {
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
    <Sheet open={isDrawerOpen} onOpenChange={handleDrawerClose}>
      <SheetContent
        width="ninety"
        background="white"
        handleDrawerClose={handleDrawerClose}
        isDrawerOpen={isDrawerOpen}
      >
        {/* sheet title is for preventing error we are not using it*/}
        <SheetTitle>{conversation?.title || ""}</SheetTitle>

        {loading ? (
          <div className="w-full mt-10">
            <MultiLineSkeletonLoader lines={5} justifyContent="left" />
          </div>
        ) : (
          <div
            className="p-3 pt-6 pb-8 overflow-y-auto h-full hide-scrollbar mt-12"
            style={{ maxHeight: "90vh" }}
          >
            {conversation?.messages?.map((message, index) => {
              const isUserMessage = message.role === "user";
              const messageContent = removeCitations(getMessageContent(message));
              const formattedMessage = formatMessage(messageContent);
              
              return (
                <div
                  key={index}
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
                    {renderAttachments(isUserMessage, message.attachments)}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ConversationDrawer;