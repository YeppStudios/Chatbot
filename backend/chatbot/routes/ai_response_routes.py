from chatbot.constants import ANTHROPIC_SEARCH_TOOL, OPENAI_SEARCH_TOOL
from chatbot.services.llm.anthropic import AnthropicLLM
from chatbot.services.llm.openai import OpenAILLM
from chatbot.services.retrieval.vector_search import VectorSearchService, VectorStoreConfig
from chatbot.database.database import db
from chatbot.models.message import Message, Citation
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any, AsyncGenerator
import os
import logging
import time
import json
from bson import ObjectId
from datetime import datetime
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from chatbot.middleware.jwt import verify_access_token

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("llm_search")

load_dotenv()

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

vector_search_service = VectorSearchService()

class LLMConfig(BaseModel):
    provider: Literal["openai", "anthropic"]
    model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 1000
    system_message: Optional[str] = (
        "You are a helpful AI assistant that specializes in educating users about the medical equipment produced by Metrum Cyroflex as well as related treatments and topics. You respond only based on the course and book content. By default you speak fluently in Polish, but when asked in different language you switch to user language. Sound natural and give direct answers.\n\n\nNever greet user. Rather ask followup question. \n\nYou respond only to questions related to Metrum Cyroflex, related treatments and topics.\n\nYou reply only based on the facts you can find in retrieved content and nothing else.\n\nDo not refer to uploaded files, rather treat it as your knowledgebase. \n If you feel like the question user has asked requires extra course or Metrum Cyroflex knowledge, ALWAYS call search_vector_store function."
    )

class LLMSearchRequest(BaseModel):
    query: str
    vector_store: VectorStoreConfig
    llm: LLMConfig

class SearchResult(BaseModel):
    text: str
    score: float
    filename: str

class LLMSearchResponse(BaseModel):
    llm_response: str
    vector_search_results: List[SearchResult]
    llm_provider: str
    llm_model: str

class ConversationLLMRequest(BaseModel):
    conversation_id: str
    query: str
    vector_store: VectorStoreConfig
    llm: LLMConfig
    stream: bool = False

@router.post("/ask-llm", response_model=LLMSearchResponse)
async def llm_search(request: LLMSearchRequest):
    request_id = f"req_{int(time.time())}_{request.query[:10].replace(' ', '_')}"
    try:
        search_results = await vector_search_service.perform_vector_search(
            query=request.query,
            vector_config=request.vector_store
        )
        context = vector_search_service.prepare_context(search_results)
        messages = [
            {"role": "system", "content": f"Context:\n{context}"},
            {"role": "user", "content": request.query}
        ]
        llm = (OpenAILLM if request.llm.provider == "openai" else AnthropicLLM)(
            model=request.llm.model,
            stream=False,
            temperature=request.llm.temperature,
            max_tokens=request.llm.max_tokens,
            instructions=request.llm.system_message
        )
        response = await llm.generate_response(messages)
        llm_response = response if isinstance(response, str) else ""
        return LLMSearchResponse(
            llm_response=llm_response,
            vector_search_results=[
                SearchResult(
                    text=result["text"],
                    score=result["score"],
                    filename=result.get("filename", "unknown")
                )
                for result in search_results
            ],
            llm_provider=request.llm.provider,
            llm_model=request.llm.model
        )
    except Exception as e:
        logger.error(f"[{request_id}] Error processing request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/ask-llm-conversation")
async def llm_search_with_conversation(
    request: ConversationLLMRequest,
    # token: str = Depends(oauth2_scheme)
):
    request_id = f"req_{int(time.time())}_{request.query[:10].replace(' ', '_')}"
    try:
        # Step 1: Fetch conversation and up to 6 latest messages
        conversation = await db['conversations'].find_one({"_id": ObjectId(request.conversation_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        messages = sorted(
            [Message(**msg) for msg in conversation.get('messages', [])],
            key=lambda x: x.timestamp
        )[-6:]
        
        # Step 2: Save the query as a message
        query_message = Message(
            role="user",
            content=request.query,
            timestamp=datetime.utcnow()
        )
        await db['conversations'].update_one(
            {"_id": ObjectId(request.conversation_id)},
            {"$push": {"messages": query_message.model_dump()}}
        )
        
        # Step 3: Prepare messages list for first LLM call with search tool
        message_list = [{"role": msg.role, "content": msg.content} for msg in messages] + [
            {"role": "user", "content": request.query}
        ]
        
        # Step 4: First LLM call with search tool
        tools = OPENAI_SEARCH_TOOL if request.llm.provider == "openai" else ANTHROPIC_SEARCH_TOOL
        llm = (OpenAILLM if request.llm.provider == "openai" else AnthropicLLM)(
            model=request.llm.model,
            stream=False,
            temperature=request.llm.temperature,
            max_tokens=request.llm.max_tokens,
            tools=tools,
            instructions=request.llm.system_message
        )
        initial_response = await llm.generate_response(message_list)
        
        # Step 5: Check if search tool was called
        search_query = None
        context = ""
        search_results = []
        if isinstance(initial_response, dict) and initial_response.get("type") == "function_call" and initial_response["name"] == "search_vector_store":
            search_query = json.loads(initial_response["arguments"])["query"]
            logger.info(f"[{request_id}] Search tool called with query: {search_query}")
            search_results = await vector_search_service.perform_vector_search(
                query=search_query,
                vector_config=request.vector_store
            )
            context = vector_search_service.prepare_context(search_results)
            print(context)
            last_user_message = message_list[-1]
            if last_user_message["role"] == "user":
                message_list[-1] = {
                    "role": "user",
                    "content": f"Memory Recall:\n{context}\n\nUser query: \n{last_user_message['content']}"
                }
        
        # Step 6: Final LLM call with system_message in instructions/system
        llm = (OpenAILLM if request.llm.provider == "openai" else AnthropicLLM)(
            model=request.llm.model,
            stream=request.stream,
            temperature=request.llm.temperature,
            max_tokens=request.llm.max_tokens,
            instructions="You are a helpful AI assistant of Metrum Cyroflex company that makes medical equipment. You are very helpful AI assistant. Treat memory recall as your memory based on trained courses and book meterials. Apply nice, clean and readable text formatting."
        )
        response = await llm.generate_response(message_list)
        
        # Step 7: Handle response and save it
        if not request.stream:
            llm_content = response if isinstance(response, str) else ""
            assistant_message = Message(
                role="assistant",
                content=llm_content,
                timestamp=datetime.utcnow(),
                citations=[Citation(citation=result["text"], file_reference="vector_search_result") 
                          for result in search_results] if search_results and isinstance(response, str) else None
            )
            await db['conversations'].update_one(
                {"_id": ObjectId(request.conversation_id)},
                {"$push": {"messages": assistant_message.model_dump()}}
            )
            await db['conversations'].update_one(
                {"_id": ObjectId(request.conversation_id)},
                {"$set": {"lastUpdated": datetime.utcnow()}}
            )
            return LLMSearchResponse(
                llm_response=llm_content,
                vector_search_results=[SearchResult(text=result["text"], score=result["score"]) 
                                      for result in search_results],
                llm_provider=request.llm.provider,
                llm_model=request.llm.model
            )
        else:
            async def stream_response_with_retrieval() -> AsyncGenerator[str, None]:
                if search_query:
                    yield f"data: {json.dumps({'type': 'retrieving', 'content': f'Searching for: {search_query}'})}\n\n"
                full_content = ""
                async for chunk in response:
                    if chunk["type"] == "text":
                        full_content += chunk["content"]
                        yield f"data: {json.dumps({'type': 'text', 'content': chunk['content']})}\n\n"
                    elif chunk["type"] == "function_call":
                        yield f"data: {json.dumps({'type': 'function_call', 'name': chunk['name'], 'arguments': chunk['arguments']})}\n\n"
                assistant_message = Message(
                    role="assistant",
                    content=full_content,
                    timestamp=datetime.utcnow(),
                    citations=[Citation(citation=result["text"], file_reference="vector_search_result") 
                              for result in search_results] if search_results and full_content else None
                )
                await db['conversations'].update_one(
                    {"_id": ObjectId(request.conversation_id)},
                    {"$push": {"messages": assistant_message.model_dump()}}
                )
                await db['conversations'].update_one(
                    {"_id": ObjectId(request.conversation_id)},
                    {"$set": {"lastUpdated": datetime.utcnow()}}
                )
            return StreamingResponse(
                stream_response_with_retrieval(),
                media_type="text/event-stream",
                headers={"Content-Type": "text/event-stream; charset=utf-8"}
            )
    except Exception as e:
        logger.error(f"[{request_id}] Error processing request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))