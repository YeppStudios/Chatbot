"use client";

import useGetConversations from "@/hooks/useGetConverstaions";
import React, { useState } from "react";
import ConversationTitle from "./ConversationTitle";
import ConversationsList from "./ConversationsList";
import ConversationDrawer from "./ConversationDrawer";
import ConversationHistoryFooter from "./ConversationHistoryFooter";

const ConversationHistory = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  const [sortType, setSortType] = useState("latest");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);

  const { conversationsList, loading } = useGetConversations({
    token: "",
    currentPage,
  });

  return (
    <div className="bg-white h-screen w-full overflow-hidden">
      <ConversationTitle
        sortMessages={setSortType}
        isOpen={isDropdownOpen}
        setIsOpen={setIsDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
      />
      <ConversationsList
        sortType={sortType}
        conversationsList={conversationsList}
        setSelectedConversation={setSelectedConversation}
        setIsDrawerOpen={setIsDrawerOpen}
        loading={loading}
      />
      <ConversationDrawer
        isDrawerOpen={isDrawerOpen}
        handleDrawerClose={setIsDrawerOpen}
        threadId={selectedConversation}
      />
      <ConversationHistoryFooter
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
};
export default ConversationHistory;
