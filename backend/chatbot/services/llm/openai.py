# chatbot/services/llm/openai_llm.py
from typing import List, AsyncGenerator, Union, Dict, Any, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI
import json

load_dotenv()

class OpenAILLM:
    def __init__(
        self,
        model: str = "gpt-4o",
        stream: bool = False,
        temperature: Optional[float] = 1.0,
        max_tokens: Optional[int] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        instructions: Optional[str] = None,
    ):
        self.openai = AsyncOpenAI()
        self.model = model
        self.stream = stream
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.tools = tools
        self.instructions = instructions

    async def generate_response(self, messages: List[Dict[str, str]]) -> Union[str, AsyncGenerator[Dict[str, Any], None]]:
        # Prepend system message if instructions are provided
        if self.instructions:
            messages = [{"role": "system", "content": self.instructions}] + messages

        params = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": self.stream,
        }
        if self.tools:
            params["tools"] = self.tools
            params["tool_choice"] = "auto"

        if not self.stream:
            response = await self.openai.chat.completions.create(**params)
            choice = response.choices[0]
            if choice.message.content:
                return choice.message.content
            elif choice.message.tool_calls:
                tool_call = choice.message.tool_calls[0]
                return {
                    "type": "function_call",
                    "name": tool_call.function.name,
                    "arguments": tool_call.function.arguments
                }
            return ""
        
        else:
            stream = await self.openai.chat.completions.create(**params)
            
            async def stream_response():
                full_text = ""
                tool_name = None
                tool_arguments = ""
                
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        delta = chunk.choices[0].delta.content
                        full_text += delta
                        yield {"type": "text", "content": delta}
                    elif chunk.choices and chunk.choices[0].delta.tool_calls:
                        tool_call_delta = chunk.choices[0].delta.tool_calls[0]
                        if tool_call_delta.function.name and not tool_name:
                            tool_name = tool_call_delta.function.name
                        if tool_call_delta.function.arguments:
                            tool_arguments += tool_call_delta.function.arguments
                    elif chunk.choices and chunk.choices[0].finish_reason == "tool_calls":
                        if tool_name and tool_arguments:
                            yield {
                                "type": "function_call",
                                "name": tool_name,
                                "arguments": tool_arguments
                            }
                            tool_name = None
                            tool_arguments = ""
            
            return stream_response()