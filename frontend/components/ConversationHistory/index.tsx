"use client";

import React, { useState, useEffect } from "react";
import ConversationTitle from "./ConversationTitle";
import ConversationsList from "./ConversationsList";
import ConversationDrawer from "./ConversationDrawer";
import ConversationHistoryFooter from "./ConversationHistoryFooter";
import { getAuthToken } from "@/utils/auth/getToken";
import useGetConversations from "@/hooks/useGetConverstaions";
import useConversationStore from "@/store/useConversationStore";

const ConversationHistory = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  const [sortType, setSortType] = useState("latest");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [token, setToken] = useState("");

  useEffect(() => {
    const authToken = getAuthToken();
    if (authToken) {
      setToken(authToken);
    }
  }, []);

  const deletedConversationId = useConversationStore(
    (state) => state.deletedConversationId
  );

  const { conversationsList, loading, totalPages } = useGetConversations({
    token,
    currentPage,
  });

  useEffect(() => {
    if (
      deletedConversationId &&
      deletedConversationId === selectedConversation
    ) {
      setIsDrawerOpen(false);
      setSelectedConversation(null);
    }
  }, [deletedConversationId, selectedConversation]);

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
