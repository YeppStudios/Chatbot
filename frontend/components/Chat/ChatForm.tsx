import React, { useState } from "react";

import Button from "../Button";
import { cn } from "@/utils/cn";
import RecordingButton from "../RecordingButton";
import TimerButton from "../TimerButton";

interface ChatFromProps {
  input: string;
  sendMessage: (e: any) => void;
  setInput: (value: string) => void;
  isRecordingRunning: boolean;
  setIsRecordingRunning: (v: boolean) => void;
  setVoiceMessage: (message: string) => void;
  time: number;
  setTime: (time: (prevTime: number) => number) => void;
}

const ChatForm = ({
  sendMessage,
  input,
  setInput,
  isRecordingRunning,
  setIsRecordingRunning,
  setVoiceMessage,
  time,
  setTime,
}: ChatFromProps) => {
  const [displaySendButton, setDisplaySendButton] = useState<boolean>(false);
  const [displayTimer, setDisplayTimer] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(e);
    setDisplaySendButton(false);
    setDisplayTimer(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-0 sm:p-6 w-full">
      <div className="w-full flex items-center justify-between gap-4">
        {displayTimer ? (
          <TimerButton
            isRecordingRunning={isRecordingRunning}
            time={time}
            setTime={setTime}
          />
        ) : (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Let's chat!"
            type="text"
            className="rounded-xl h-12 outline-none shadow-inner px-4 border text-white border-white backdrop-blur-sm  bg-black bg-opacity-40 w-full"
          />
        )}
        {input || displaySendButton ? (
          <Button
            onClick={handleSubmit}
            iconSrc="/send_white.png"
            iconOnly={true}
            className="rounded-xl w-10 bg-black border border-neutral-400 bg-opacity-40 hover:bg-opacity-70 backdrop-blur-sm"
            type={"submit"}
          />
        ) : (
          <RecordingButton
            setDisplaySendButton={setDisplaySendButton}
            setIsRecordingRunning={setIsRecordingRunning}
            setVoiceMessage={setVoiceMessage}
            setTime={setTime}
            setDisplayTimer={setDisplayTimer}
            micImg="/micIconW.png"
            className={cn(
              "rounded-xl w-10 bg-black border border-neutral-400 opacity-40 hover:bg-opacity-70 backdrop-blur-sm"
            )}
          />
        )}
      </div>
    </form>
  );
};

export default ChatForm;
