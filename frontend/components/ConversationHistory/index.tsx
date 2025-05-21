"use client";

import Link from 'next/link';
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
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [sortType, setSortType] = useState("latest");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [token, setToken] = useState<string>("");

  // Continuously check for token updates
  useEffect(() => {
    const updateToken = () => {
      const authToken = getAuthToken();
      if (authToken && authToken !== token) {
        setToken(authToken); // Update token if it changes
      }
    };

    // Run once on mount
    updateToken();

    // Poll for token changes (e.g., every second) after redirect
    const interval = setInterval(updateToken, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [token]); // Depend on token to avoid unnecessary re-renders

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
        conversationId={selectedConversation}
      />
      <ConversationHistoryFooter
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
      <Link href="/pdf-management" className="text-purple-chat hover:text-purple-chat/80 font-medium">
        Manage PDF Files
      </Link>
    </div>
  );
};

export default ConversationHistory;