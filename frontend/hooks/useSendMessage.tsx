import { useCallback, useRef, useEffect } from "react";

import { useSelector } from "react-redux";

import { RootState } from "@/app/types";
import { useAppSelector } from "@/store/hooks";
import { repeatHandler } from "@/utils/handlers";
import { askAI } from "@/utils/askAi";

interface FunctionCall {
  name: string;
  status: "queued" | "pending" | "completed";
  outputs: any;
  call_id: string | null;
}

const useSendMessage = ({
  input,
  setMessages,
  setInput,
  setAiThinking,
  toolAction,
  setToolAction,
  mediaElement,
  session,
}: any) => {
  const jsonChunkBuffer = useRef("");
  const responseBuffer = useRef("");
  const functionCallRef = useRef<FunctionCall[]>([]);
  const currentMessageIdRef = useRef<string | null>(null);
  const isStreamingRef = useRef(false);
  const settings = useSelector((state: any) => state.pageSettings);
  const conversationId: any = useSelector(
    (state: any) => state.conversation.id
  );
  const assistantId: any = useSelector(
    (state: any) => state.pageSettings.assistantID
  );
  const { language } = useAppSelector((state: RootState) => state.user);
  const sentenceQueue = useRef<string[]>([]);
  const processingRef = useRef(false);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const processResponseBuffer = useCallback(() => {
    const sentenceEndRegex =
      /(?<!\b(?:[A-Z][a-z]*|(?:1[1-9]|[2-9]\d+|\d{3,})|(?:Dr|Mr|Ms|Mrs|Prof|Sr|Jr|St|vs|etc|i\.e|e\.g|p\.s|n\.b)))[.!?](?=\s|$)/g;
    let match;
    let lastIndex = 0;

    while ((match = sentenceEndRegex.exec(responseBuffer.current)) !== null) {
      const sentence = responseBuffer.current
        .slice(lastIndex, match.index + 1)
        .trim();
      if (sentence) {
        sentenceQueue.current.push(sentence);
      }
      lastIndex = match.index + 1;
    }

    responseBuffer.current = responseBuffer.current.slice(lastIndex);

    processQueue();
  }, []);

  const processQueue = useCallback(async () => {
    if (!processingRef.current && sentenceQueue.current.length > 0) {
      processingRef.current = true;
      const nextSentence = sentenceQueue.current.shift();
      if (nextSentence) {
        try {
          await repeatHandler({
            sessionInfo: sessionRef.current,
            taskInput: nextSentence,
          });
        } catch (error) {
          console.error("Error in repeatHandler:", error);
        }
      }
      processingRef.current = false;
      if (sentenceQueue.current.length > 0) {
        processQueue();
      }
    }
  }, []);

  const processChunk = useCallback(
    (chunk: string) => {
      chunk = chunk.replace(/data: /g, "").trim();
      jsonChunkBuffer.current += chunk;

      let startIndex = 0;
      let endIndex;
      while (
        (endIndex = jsonChunkBuffer.current.indexOf("}", startIndex)) !== -1
      ) {
        const possibleJson = jsonChunkBuffer.current.substring(0, endIndex + 1);
        try {
          const json = JSON.parse(possibleJson);
          jsonChunkBuffer.current = jsonChunkBuffer.current
            .substring(endIndex + 1)
            .trim();
          startIndex = 0;

          if (json.type === "text" && json.data) {
            if (!isStreamingRef.current) {
              isStreamingRef.current = true;
            }
            responseBuffer.current += json.data;
            setMessages((prevMessages: any) =>
              prevMessages.map((msg: any) =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, text: msg.text + json.data }
                  : msg
              )
            );
            setAiThinking(false);
            processResponseBuffer();
          }

          if (json.type === "function_call") {
            const newFunctionCall: FunctionCall = {
              name: json.data.name,
              status: "queued",
              outputs: null,
              call_id: null,
            };
            functionCallRef.current.push(newFunctionCall);

            setMessages((prevMessages: any) =>
              prevMessages.map((msg: any) =>
                msg.id === currentMessageIdRef.current
                  ? {
                      ...msg,
                      functionCall: [
                        ...(msg.functionCall || []),
                        newFunctionCall,
                      ],
                    }
                  : msg
              )
            );
            setAiThinking(false);
          }
          console.log(json.data[0], "json.data[0]");

          if (json.type === "tool_action") {
            setToolAction([
              {
                id: json.data[0].id,
                run_id: json.data[0].run_id,
                function: json.data[0].function,
              },
            ]);

            const updatedFunctionCall = functionCallRef.current.find(
              (fc) => fc.name === json.data[0].function.name
            );
            if (updatedFunctionCall) {
              updatedFunctionCall.status = "pending";
              updatedFunctionCall.call_id = json.data[0].id;

              setMessages((prevMessages: any) =>
                prevMessages.map((msg: any) =>
                  msg.id === currentMessageIdRef.current
                    ? {
                        ...msg,
                        functionCall: msg.functionCall.map((fc: FunctionCall) =>
                          fc.name === updatedFunctionCall.name
                            ? updatedFunctionCall
                            : fc
                        ),
                      }
                    : msg
                )
              );
            }
          }

          if (json.type === "tool_outputs") {
            console.log("tool output: ", json.data);
            const output = json.data;
            const updatedFunctionCall = functionCallRef.current.find(
              (fc) => fc.call_id === output.tool_call_id
            );
            if (updatedFunctionCall) {
              updatedFunctionCall.status = "completed";
              try {
                updatedFunctionCall.outputs = JSON.parse(output.output);
              } catch (error) {
                console.error("Error parsing tool output:", error);
                updatedFunctionCall.outputs = output.output;
              }

              setMessages((prevMessages: any) =>
                prevMessages.map((msg: any) =>
                  msg.id === currentMessageIdRef.current
                    ? {
                        ...msg,
                        functionCall: msg.functionCall.map((fc: FunctionCall) =>
                          fc.call_id === updatedFunctionCall.call_id
                            ? updatedFunctionCall
                            : fc
                        ),
                      }
                    : msg
                )
              );
            }
          }
        } catch (error) {
          startIndex = endIndex + 1;
        }
      }
    },
    [setMessages, setToolAction, setAiThinking, processResponseBuffer]
  );

  const sendMessage = useCallback(
    async (e: any) => {
      e.preventDefault();

      const userMessage = {
        id: Date.now().toString(),
        text: input,
        sender: "You",
      };
      setMessages((messages: any) => [...messages, userMessage]);
      setInput("");
      setAiThinking(true);
      isStreamingRef.current = false;

      const runId = toolAction[0]?.run_id || "";
      const callId = toolAction[0]?.id || "";
      console.log(conversationId, "conversationId");
      try {
        const reader = await askAI(
          input,
          "gpt-4o",
          conversationId,
          true,
          language,
          assistantId,
          runId,
          callId
        );
        if (mediaElement?.current) {
          mediaElement.current.muted = false;
        }
        if (reader) {
          responseBuffer.current = "";
          functionCallRef.current = [];
          sentenceQueue.current = [];

          const assistantMessageId = Date.now().toString();
          currentMessageIdRef.current = assistantMessageId;
          setMessages((messages: any) => [
            ...messages,
            {
              id: assistantMessageId,
              text: "",
              sender: "Assistant",
              functionCall: [],
            },
          ]);

          const read = () => {
            reader.read().then(({ done, value }: any) => {
              if (done) {
                currentMessageIdRef.current = null;
                isStreamingRef.current = false;
                processResponseBuffer(); // Process any remaining content
                return;
              }

              const textChunk = new TextDecoder().decode(value);
              processChunk(textChunk);
              read();
            });
          };

          read();
        } else {
          throw new Error("Stream reader not available");
        }
      } catch (error) {
        console.error("Failed to send to AI:", error);
        setAiThinking(false);
      }
    },
    [
      input,
      setMessages,
      setInput,
      setAiThinking,
      assistantId,
      setToolAction,
      toolAction,
      processChunk,
      settings.avatarID,
      conversationId,
    ]
  );

  return sendMessage;
};

export default useSendMessage;
