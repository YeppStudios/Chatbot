import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConversationSorterItem from "./ConversationSorterItem";

interface ConversationSorterDropdownProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  sortMessages: (sortValue: string) => void;
  setIsDropdownOpen: (isOpen: boolean) => void;
}

const ConversationSorterDropdown: React.FC<ConversationSorterDropdownProps> = ({
  isOpen,
  setOpen,
  sortMessages,
  setIsDropdownOpen,
}) => {
  return (
    <DropdownMenu open={isOpen} onOpenChange={setOpen}>
      <DropdownMenuTrigger />

      <DropdownMenuContent className="mt-3 p-2 text-xs flex flex-col bg-white ">
        <ConversationSorterItem
          imgSrc="/clock.png"
          sortMessages={sortMessages}
          sortValue="latest"
          title="Latest"
          setIsDropdownOpen={setIsDropdownOpen}
        />
        <ConversationSorterItem
          imgSrc="/most.png"
          sortMessages={sortMessages}
          sortValue="most"
          title="Most messages first"
          setIsDropdownOpen={setIsDropdownOpen}
        />
        <ConversationSorterItem
          imgSrc="/least.png"
          sortMessages={sortMessages}
          sortValue="least"
          title="Least messages first"
          setIsDropdownOpen={setIsDropdownOpen}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ConversationSorterDropdown;
