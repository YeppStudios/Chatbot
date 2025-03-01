import React from "react";
import Image from "next/image";

import { Conversation } from "@/types";

import useSortedConversations from "@/hooks/useSortedConversations";
import { MultiLineSkeletonLoader } from "../Loaders";

interface ConversationsListProps {
  sortType: string;
  loading: boolean;
  setIsDrawerOpen: (value: boolean) => void;
  setSelectedConversation: any;
  conversationsList: Conversation[];
}

const ConversationsList = ({
  conversationsList,
  setSelectedConversation,
  loading,
  setIsDrawerOpen,
  sortType,
}: ConversationsListProps) => {
  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation.threadId);
    setIsDrawerOpen(true);
  };

  const conversationList = useSortedConversations({
    conversations: conversationsList,
    sortType,
  });

  return (
    <div className="flex flex-1 h-full overflow-y-scroll py-10 flex-col items-center p-2 sm:p-8 pb-10 sm:pb-36">
      {loading && (
        <div className="items-center pt-6">
          <MultiLineSkeletonLoader lines={6} justifyContent="left" />
        </div>
      )}
      {conversationList &&
        conversationList.map((conversation: Conversation, index: number) => {
          let date = new Date(conversation.lastUpdated);

          let formattedDate = date.toLocaleDateString("en-GB");
          let formattedHour = date.toLocaleTimeString("en-US", {
            hourCycle: "h23",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div
              key={index}
              onClick={() => handleConversationClick(conversation)}
              className="flex items-center justify-between bg-white w-[80vw] lg:w-[60%] rounded-xl px-4 sm:px-6 py-4 mb-3 text-xs sm:text-sm shadow-md cursor-pointer hover:bg-gray-100"
            >
              <div className="flex gap-4 sm:gap-8 items-center">
                <Image
                  src="/conversation_chat.png"
                  alt=""
                  height={0}
                  width={0}
                  className="w-4 h-4"
                />
                <div className="hidden sm:block w-32">
                  {" "}
                  {conversation.title}
                </div>

                <p className=" w-24 sm:w-40"> {formattedDate}</p>
                <div className="flex items-center justify-start gap-4">
                  {" "}
                  {formattedHour}
                  <p className="text-gray-400 text-xs">UTC time</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:w-40">
                <p className="text-slate-500"></p>
                <Image
                  src="/more.png"
                  alt=""
                  height={0}
                  width={0}
                  className="w-3 ml-2 sm:w-4 sm:h-4"
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default ConversationsList;
