import { submitToolResponse } from "@/utils/submitToolResponse";
import { useCallback, useRef } from "react";

interface FunctionCall {
  name: string;
  status: "queued" | "pending" | "completed";
  outputs: any;
  call_id: string | null;
}

const useSubmitToolResponse = ({
  toolAction,
  setToolAction,
  setMessages,
  salesProcess,
  setAiThinking,
}: any) => {
  const jsonChunkBuffer = useRef("");
  const responseBuffer = useRef("");
  const functionCallRef = useRef<FunctionCall[]>([]);
  const currentMessageIdRef = useRef<string | null>(null);
  const isStreamingRef = useRef(false);

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
                  ? { ...msg, text: responseBuffer.current }
                  : msg
              )
            );
            setAiThinking(false);
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
                  ? { ...msg, functionCall: newFunctionCall }
                  : msg
              )
            );
            setAiThinking(false);
          }

          if (json.type === "tool_action") {
            setToolAction(json.data);
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
                        functionCall: updatedFunctionCall,
                      }
                    : msg
                )
              );
            }
          }

          if (json.type === "tool_outputs") {
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
                        functionCall: updatedFunctionCall,
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
    [setMessages, setToolAction, setAiThinking]
  );

  const submitResponse = useCallback(
    async (e: any, toolResponse: string) => {
      if (e) {
        e.preventDefault();
      }

      if (!salesProcess || !toolResponse) return;

      try {
        const tool_outputs = [
          { tool_call_id: toolAction[0].id, output: toolResponse },
        ];
        const reader = await submitToolResponse(
          toolAction[0].run_id,
          salesProcess,
          tool_outputs
        );
        if (reader) {
          responseBuffer.current = "";
          functionCallRef.current = [];
          isStreamingRef.current = false;

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
    [toolAction, setMessages, salesProcess, setAiThinking, processChunk]
  );

  return submitResponse;
};

export default useSubmitToolResponse;
