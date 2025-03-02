import React, {
  useEffect,
  useState,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import ReactMarkdown from "react-markdown";
import { MultiLineSkeletonLoader } from "../Loaders";
import { cn } from "@/utils/cn";
import { getConversation } from "@/utils/getConversation";
import { Sheet, SheetContent, SheetTitle } from "../ui/sheet";

interface ConversationDrawerProps {
  isDrawerOpen: boolean;
  handleDrawerClose: Dispatch<SetStateAction<boolean>>;
  threadId: string | null;
}
interface Message {
  role: string;
  content: { text: { value: string } }[];
  created_at: number;
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isDrawerOpen,
  handleDrawerClose,
  threadId,
}) => {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setLoading(true);
    const fetchConversation = async () => {
      if (threadId) {
        const fetchedConversation = await getConversation(threadId);
        const sortedMessages = fetchedConversation.sort(
          (a: { created_at: number }, b: { created_at: number }) =>
            a.created_at - b.created_at
        );
        setConversation(sortedMessages);
      }
      setLoading(false);
    };

    if (isDrawerOpen) {
      fetchConversation();
    }
  }, [isDrawerOpen, threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  function removeCitations(text: string) {
    // This regex matches the pattern 【digits:digits†source】
    const citationRegex = /【\d+:\d+†source】/g;
    return text.replace(citationRegex, "");
  }

  return (
    <Sheet open={isDrawerOpen} onOpenChange={handleDrawerClose}>
      <SheetContent
        width="ninety"
        background="white"
        handleDrawerClose={handleDrawerClose}
        isDrawerOpen={isDrawerOpen}
      >
        {/* sheet title is for preventing error we are not using it*/}
        <SheetTitle>{""}</SheetTitle>

        {loading ? (
          <div className="w-full mt-10">
            <MultiLineSkeletonLoader lines={5} justifyContent="left" />
          </div>
        ) : (
          <div
            className="overflow-y-scroll overflow-x-visible h-full hide-scrollbar mt-12"
            style={{ maxHeight: "90vh" }}
          >
            {conversation.map((message, index) => (
              <div key={index} className="w-full">
                <div
                  className={cn("rounded-lg border border-gray-100 p-4 mb-4", {
                    "bg-gray-100": message.role === "user",
                  })}
                >
                  <div className="text-sm">
                    <ReactMarkdown>
                      {removeCitations(message.content[0].text.value)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ConversationDrawer;
