"use client";
import { UserMessage } from "@/app/types";
import Chat from "@/components/Chat";
import useSubmitToolResponse from "@/hooks/useSubmitToolResponse";
import { useRef, useState } from "react";
import ChatForm from "./ChatForm";
import useSendMessage from "@/hooks/useSendMessage";
import { useSelector } from "react-redux";

const ChatFacade = () => {
  const [toolAction, setToolAction] = useState([
    {
      function: { arguments: "", name: "" },
      id: "",
      run_id: "",
      thread_id: "",
    },
  ]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [voiceMessage, setVoiceMessage] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [isRecordingRunning, setIsRecordingRunning] = useState<boolean>(false);
  const mediaElement = useRef<HTMLMediaElement>(null);
  const [time, setTime] = useState<number>(0);
  const session = useSelector((state: any) => state.session);

  const submitToolResponse = useSubmitToolResponse({
    toolAction,
    setToolAction,
    setMessages,
    setAiThinking,
  });

  const sendMessage = useSendMessage({
    input: voiceMessage ? voiceMessage : input,
    setMessages,
    setInput,
    setAiThinking,
    toolAction,
    setToolAction,
    mediaElement,
    session,
  });
  return (
    <>
      <Chat
        messages={messages}
        aiThinking={aiThinking}
        submitToolResponse={submitToolResponse}
        toolAction={toolAction}
      />
      <div className="fixed bottom-0 right-0 w-full sm:w-[25rem] md:w-[32rem] lg:w-[40rem] py-4 px-4 gap-6 sm:gap-0 flex-wrap  sm:items-center justify-end sm:p-6 flex z-10">
        <ChatForm
          sendMessage={sendMessage}
          input={input}
          setVoiceMessage={setVoiceMessage}
          setInput={setInput}
          isRecordingRunning={isRecordingRunning}
          setIsRecordingRunning={setIsRecordingRunning}
          time={time}
          setTime={setTime}
        />
      </div>
    </>
  );
};
export default ChatFacade;
