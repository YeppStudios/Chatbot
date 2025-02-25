import React from "react";
import Image from "next/image";

interface ConversationSorterItemProps {
  imgSrc: string;
  sortMessages: (value: string) => void;
  sortValue: string;
  title: string;
  setIsDropdownOpen: (value: boolean) => void;
}

const ConversationSorterItem = ({
  imgSrc,
  sortMessages,
  sortValue,
  title,
  setIsDropdownOpen,
}: ConversationSorterItemProps) => {
  return (
    <div
      onClick={() => {
        sortMessages(sortValue);
        setIsDropdownOpen(false);
      }}
      className="cursor-pointer p-2 rounded-md hover:bg-slate-100 flex items-center gap-2"
    >
      <Image src={imgSrc} width={0} height={0} alt="" className="w-3 h-3" />
      {title}
    </div>
  );
};

export default ConversationSorterItem;
