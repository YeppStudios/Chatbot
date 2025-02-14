import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import TypingAnimation from "./TypingAnimation";
import GoogleMapsMessage from "./GoogleMapsMessage";

interface FunctionCall {
  name: string;
  status: "queued" | "pending" | "completed";
  outputs: any;
  call_id: string | null;
}

interface ChatMessageProps {
  message: {
    text: string;
    sender: string;
    textAnimation?: boolean;
    functionCall?: FunctionCall[];
  };
  loading: boolean;
  className?: string;
  animated?: boolean;
  submitToolResponse?: any;
  toolAction?: any;
}

const FunctionCallComponent = ({
  functionCall,
  submitToolResponse,
  toolAction,
}: {
  functionCall: any;
  submitToolResponse: any;
  toolAction: any;
}) => {
  const matchingToolAction = toolAction?.find(
    (action: any) => action.function.name === functionCall.name
  );

  switch (functionCall.name) {
    case "init-search_nearby_places":
      return <GoogleMapsMessage message={{ functionCall: [functionCall] }} />;
    case "init-get_distance_matrix":
      return <GoogleMapsMessage message={{ functionCall: [functionCall] }} />;
    default:
      return null;
  }
};

const ChatMessage = ({
  message,
  loading,
  className,
  animated = false,
  submitToolResponse,
  toolAction,
}: ChatMessageProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  function escapePeriod(text: string) {
    return text?.replace(/(\d+)\./g, "$1\\.") || "";
  }

  const formattedMessage = escapePeriod(message.text);

  useEffect(() => {
    setShouldAnimate(message.textAnimation || false);
  }, [message.textAnimation]);

  const renderMessageContent = () => {
    if (loading) {
      return <TypingAnimation colorful={false} />;
    }

    if (shouldAnimate) {
      return (
        <TypeAnimation
          sequence={[formattedMessage]}
          wrapper="div"
          cursor={false}
          repeat={1}
          speed={90}
          style={{ whiteSpace: "pre-line" }}
        />
      );
    }

    return (
      <ReactMarkdown
        components={{
          p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
            <p style={{ whiteSpace: "pre-line" }}>{props.children}</p>
          ),
        }}
      >
        {formattedMessage}
      </ReactMarkdown>
    );
  };

  const messageContent = (
    <div
      className={clsx(
        "sm:px-7 text-sm sm:text-base flex text-white",
        className
      )}
    >
      <div className="flex items-start mr-3">
        {message.sender !== "You" ? (
          <Image
            src="/profile.png"
            width={30}
            height={30}
            alt="user avatar"
            className="object-none object-[49%_1px] min-w-[4.5vw] min-h-[4.5vw] max-w-[5vw] max-h-[5vw] rounded-full bg-black bg-opacity-40 sm:max-w-0 sm:max-h-0 sm:min-w-7 sm:min-h-7"
          />
        ) : (
          <Image
            src="/profile.png"
            width={30}
            height={30}
            alt="assistant avatar"
            className="object-none min-w-[4.5vw] min-h-[4.5vw] max-w-[5vw] max-h-[5vw] rounded-full bg-black bg-opacity-40 sm:max-w-0 sm:max-h-0 sm:min-w-7 sm:min-h-7"
          />
        )}
      </div>
      <div className="w-auto flex flex-col pb-1">
        {message.functionCall &&
          message.functionCall.map((functionCall, index) => (
            <div key={`${functionCall.name}-${functionCall.status}`}>
              <FunctionCallComponent
                functionCall={functionCall}
                submitToolResponse={submitToolResponse}
                toolAction={toolAction}
              />
            </div>
          ))}
        {(message.text || loading) && (
          <div className="rounded-xl sm:p-4 backdrop-blur bg-black bg-opacity-40 shadow-lg">
            {renderMessageContent()}
          </div>
        )}
      </div>
    </div>
  );

  return animated ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {messageContent}
    </motion.div>
  ) : (
    messageContent
  );
};

export default ChatMessage;
