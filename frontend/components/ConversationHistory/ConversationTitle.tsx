import React, { useState } from "react";
import Image from "next/image";
import ConversationSorterDropdown from "./ConversationSorterDropdown";

interface ConversationTitleProps {
  sortMessages: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  setIsDropdownOpen: (value: boolean) => void;
}

const ConversationTitle = ({
  setIsDropdownOpen,
  sortMessages,
  isOpen,
  setIsOpen,
}: ConversationTitleProps) => {
  return (
    <div className="bg-white p-5 text-center flex justify-center shadow-lg">
      <div className="flex justify-between lg:w-[60%] items-center">
        <p className="font-medium">Conversation History</p>
        <div className="flex bg-white">
          <Image
            src="/filter.png"
            alt=""
            width={10}
            height={10}
            className="w-4 h-4 ml-10 sm:ml-44"
            onClick={() => setIsOpen(!isOpen)}
          />
          <ConversationSorterDropdown
            isOpen={isOpen}
            setOpen={setIsOpen}
            sortMessages={sortMessages}
            setIsDropdownOpen={setIsDropdownOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default ConversationTitle;
