import { useReducer, useRef, useState } from "react";
import axios from "axios";

import { RootState } from "@/app/types";
import { backend } from "@/config/apiConfig";
import { useAppSelector } from "@/store/hooks";

interface State {
  recording: boolean;
  audioBlob: Blob | null;
  error: string | null;
  transcription: string | null;
}

type Action =
  | { type: "start_recording" }
  | { type: "stop_recording"; blob: Blob }
  | { type: "set_error"; error: string }
  | { type: "set_transcription"; transcription: string };

const initialState: State = {
  recording: false,
  audioBlob: null,
  error: null,
  transcription: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start_recording":
      return { ...state, recording: true, error: null, transcription: null };
    case "stop_recording":
      return { ...state, recording: false, audioBlob: action.blob };
    case "set_error":
      return { ...state, error: action.error, recording: false };
    case "set_transcription":
      return { ...state, transcription: action.transcription };
    default:
      return state;
  }
}

export function useAudioRecorder(
  language: string,
  setIsRecordingRunning: (variable: boolean) => void,
  setTime: any,
  setDisplayTimer: (variable: boolean) => void
) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const { token } = useAppSelector((state: RootState) => state.user);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => audioChunks.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        dispatch({ type: "stop_recording", blob });
        submitTranscription(blob);
      };

      recorder.start();
      dispatch({ type: "start_recording" });
      mediaRecorderRef.current = recorder;
      setIsRecordingRunning(true);
      setDisplayTimer(true);
      setTime(0);
    } catch (error) {
      dispatch({ type: "set_error", error: (error as Error).message });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream
      .getTracks()
      .forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    setIsRecordingRunning(false);
  };

  const submitTranscription = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    formData.append("language", language);
    try {
      const response = await axios.post(
        `${backend.serverUrl}/transcribe`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch({
        type: "set_transcription",
        transcription: response.data.transcription,
      });
    } catch (error) {
      dispatch({
        type: "set_error",
        error: "Error submitting audio: " + (error as Error).message,
      });
    }
  };

  return {
    state,
    startRecording,
    stopRecording,
  };
}
