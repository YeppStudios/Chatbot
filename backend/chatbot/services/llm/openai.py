from typing import List, AsyncGenerator, Union, Dict, Any, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI
import json
import logging

# Configure logger for OpenAI LLM
logger = logging.getLogger("openai_llm")
logger.setLevel(logging.INFO)

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

        # Log the final prompt being sent to OpenAI
        logger.info(f"Sending request to OpenAI model: {self.model}")
        logger.info(f"Request parameters: temperature={self.temperature}, max_tokens={self.max_tokens}, stream={self.stream}")
        logger.info(f"Number of messages: {len(messages)}")
        
        for i, message in enumerate(messages):
            role = message.get("role", "unknown")
            content = message.get("content", "")
            content_preview = content[:500] + "..." if len(content) > 500 else content
            logger.info(f"  Message[{i+1}] ({role}): {content_preview}")
            if len(content) > 500:
                logger.info(f"    Full message length: {len(content)} characters")

        if self.tools:
            logger.info(f"Tools available: {[tool.get('function', {}).get('name', 'unknown') for tool in self.tools]}")

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
            logger.info("Making non-streaming request to OpenAI...")
            response = await self.openai.chat.completions.create(**params)
            choice = response.choices[0]
            
            # Log response details
            logger.info(f"OpenAI response received:")
            logger.info(f"  Finish reason: {choice.finish_reason}")
            logger.info(f"  Usage: {response.usage.model_dump() if response.usage else 'N/A'}")
            
            if choice.message.content:
                content = choice.message.content
                content_preview = content[:500] + "..." if len(content) > 500 else content
                logger.info(f"  Response content preview: {content_preview}")
                logger.info(f"  Full response length: {len(content)} characters")
                return content
            elif choice.message.tool_calls:
                tool_call = choice.message.tool_calls[0]
                logger.info(f"  Tool call: {tool_call.function.name}")
                logger.info(f"  Tool arguments: {tool_call.function.arguments}")
                return {
                    "type": "function_call",
                    "name": tool_call.function.name,
                    "arguments": tool_call.function.arguments
                }
            logger.info("  No content or tool calls in response")
            return ""
        
        else:
            logger.info("Making streaming request to OpenAI...")
            stream = await self.openai.chat.completions.create(**params)
            
            async def stream_response():
                full_text = ""
                tool_name = None
                tool_arguments = ""
                chunk_count = 0
                
                async for chunk in stream:
                    chunk_count += 1
                    if chunk_count == 1:
                        logger.info("Started receiving streaming response from OpenAI")
                    
                    if chunk.choices and chunk.choices[0].delta.content:
                        delta = chunk.choices[0].delta.content
                        full_text += delta
                        yield {"type": "text", "content": delta}
                    elif chunk.choices and chunk.choices[0].delta.tool_calls:
                        tool_call_delta = chunk.choices[0].delta.tool_calls[0]
                        if tool_call_delta.function.name and not tool_name:
                            tool_name = tool_call_delta.function.name
                            logger.info(f"Tool call detected: {tool_name}")
                        if tool_call_delta.function.arguments:
                            tool_arguments += tool_call_delta.function.arguments
                    elif chunk.choices and chunk.choices[0].finish_reason == "tool_calls":
                        if tool_name and tool_arguments:
                            logger.info(f"Tool call completed: {tool_name} with arguments: {tool_arguments}")
                            yield {
                                "type": "function_call",
                                "name": tool_name,
                                "arguments": tool_arguments
                            }
                            tool_name = None
                            tool_arguments = ""
                
                logger.info(f"Streaming completed. Total chunks: {chunk_count}, Final text length: {len(full_text)} characters")
                if full_text:
                    preview = full_text[:300] + "..." if len(full_text) > 300 else full_text
                    logger.info(f"Final response preview: {preview}")
            
            return stream_response()