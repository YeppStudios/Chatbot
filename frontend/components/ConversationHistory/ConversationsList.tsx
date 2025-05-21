import React from "react";
import { Conversation } from "@/types";
import useSortedConversations from "@/hooks/useSortedConversations";
import { MultiLineSkeletonLoader } from "../Loaders";
import { MessageCircleReply } from "lucide-react";
import ShowMoreBox from "./DeleteConversation/ShowMoreBox";

interface ConversationsListProps {
  sortType: string;
  loading: boolean;
  setIsDrawerOpen: (value: boolean) => void;
  setSelectedConversation: any;
  conversationsList: Conversation[] | null | undefined;
}

const ConversationsList = ({
  conversationsList,
  setSelectedConversation,
  loading,
  setIsDrawerOpen,
  sortType,
}: ConversationsListProps) => {
  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation._id);
    setIsDrawerOpen(true);
  };

  // Always call the hook, regardless of loading state
  const sortedConversations = useSortedConversations({
    conversations: conversationsList || [],
    sortType,
  });

  // Then decide what to display based on loading state
  const conversationList = loading ? [] : sortedConversations;

  return (
    <div className="flex flex-1 h-full overflow-y-scroll py-10 flex-col items-center p-2 sm:p-8 pb-10 sm:pb-36">
      {/* Show loading state */}
      {loading && (
        <div className=" pt-6 w-full h-full flex justify-center">
          <div className="w-1/2">
            <MultiLineSkeletonLoader lines={6} justifyContent="left" />
          </div>
        </div>
      )}

      {/* Show empty state */}
      {!loading && (!conversationList || conversationList.length === 0) && (
        <div className="flex flex-col items-center justify-center h-full">
          <MessageCircleReply className="w-10 h-10 mb-4 opacity-20" />
          <p className="text-gray-500 text-sm sm:text-base">No conversations with messages found</p>
          <p className="text-gray-400 text-xs mt-2">Only conversations with at least one message are shown</p>
        </div>
      )}

      {/* Show conversation list */}
      {!loading &&
        conversationList &&
        conversationList.length > 0 &&
        conversationList.map((conversation: Conversation, index: number) => {
          const date = new Date(conversation.lastUpdated);

          const formattedDate = date.toLocaleDateString("en-GB");
          const formattedHour = date.toLocaleTimeString("en-US", {
            hourCycle: "h23",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div
              key={index}
              onClick={() => handleConversationClick(conversation)}
              className="flex items-center justify-between bg-white w-[80vw] lg:w-[60%] rounded-xl px-4 sm:px-6 py-4 mb-3 text-xs sm:text-sm shadow-md cursor-pointer hover:bg-gray-100 transition-colors duration-100"
            >
              <div className="flex gap-4 sm:gap-8 items-center">
                <MessageCircleReply className="w-4 h-4" />
                <div className="hidden sm:block w-32">{conversation.title}</div>

                <p className="w-24 sm:w-40">{formattedDate}</p>
                <div className="flex items-center justify-start gap-4">
                  {formattedHour}
                  <p className="text-gray-400 text-xs">UTC time</p>
                </div>
              </div>{" "}
              <ShowMoreBox conversationId={conversation._id} />
            </div>
          );
        })}
    </div>
  );
};

export default ConversationsList;