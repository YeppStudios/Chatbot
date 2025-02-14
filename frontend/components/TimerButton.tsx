import { formatTime } from "@/utils/helpers";
import Image from "next/image";
import { useState, useEffect } from "react";

interface TimerButtonProps {
  isRecordingRunning: boolean;
  time: string | number;
  setTime: (time: (prevTime: number) => number) => void;
}

const TimerButton = ({
  isRecordingRunning,
  time,
  setTime,
}: TimerButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let id = null;

    if (isRecordingRunning) {
      id = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
      setIntervalId(id);
      setIsRecording(true);
    } else if (!isRecordingRunning && intervalId) {
      clearInterval(intervalId);
      setIsRecording(false);
    }

    return () => {
      if (id) {
        clearInterval(id);
      }
    };
  }, [isRecordingRunning, setTime]);

  return (
    <div className="rounded-xl h-12 outline-none shadow-inner px-4 border border-white  bg-transparent-black-40 w-full backdrop-blur-sm text-white flex items-center gap-4 justify-center normal-nums">
      {isRecordingRunning && (
        <Image
          src="/recordingDot.gif"
          width={20}
          height={20}
          alt="recording..."
        />
      )}
      {formatTime(Number(time))}
    </div>
  );
};

export default TimerButton;
