"use client";
import React, { useEffect, useState, useRef } from "react";

import Tooltip from "./Tooltip";
import { RootState } from "@/app/types";
import { useAppSelector } from "@/store/hooks";
import Button from "./Button";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { getISO639Language } from "@/utils/getISO639Language";

interface RecordingButtonProps {
  className?: string;
  imgClassName?: string;
  setVoiceMessage: (v: string) => void;
  micImg: string;
  setDisplaySendButton?: (v: boolean) => void;
  setIsRecordingRunning: (v: boolean) => void;
  setTime: (time: (prevTime: number) => number) => void;
  setDisplayTimer: (v: boolean) => void;
  disabled?: boolean;
  sendMessage?: () => void;
}

const RecordingButton = ({
  className,
  imgClassName,
  setVoiceMessage,
  setIsRecordingRunning,
  micImg,
  setTime,
  setDisplayTimer,
  disabled = false,
  sendMessage,
}: RecordingButtonProps) => {
  const [transcribing, setTranscribing] = useState(false);
  const { language, userId } = useAppSelector((state: RootState) => state.user);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const sentenceQueue = useRef<string[]>([]);

  useEffect(() => {
    const isoLanguage = getISO639Language(language);
    setCurrentLanguage(isoLanguage);
  }, [language]);

  const { state, startRecording, stopRecording } = useAudioRecorder(
    currentLanguage,
    setIsRecordingRunning,
    setTime,
    setDisplayTimer
  );

  useEffect(() => {
    if (state.transcription) {
      setVoiceMessage(state.transcription);
      setTranscribing(false);
      if (sendMessage) {
        sendMessage();
      }
    }
  }, [state.transcription]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    if (disabled || !userId) return;
    startRecording();
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    event.preventDefault();
    if (state.recording) {
      setTranscribing(true);
      stopRecording();
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    if (disabled || !userId) return;
    startRecording();
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    if (state.recording) {
      setTranscribing(true);
      stopRecording();
    }
  };

  return (
    <Tooltip text={"Press and hold to record voice message"}>
      <Button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        iconSrc={
          state.recording
            ? "/stop_recording.png"
            : transcribing
            ? undefined
            : micImg
        }
        loading={transcribing}
        loaderColor="white"
        className={className}
        imgClassName={imgClassName}
        type="button"
        iconOnly
      />
    </Tooltip>
  );
};

export default RecordingButton;
