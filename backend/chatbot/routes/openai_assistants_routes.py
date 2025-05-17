from datetime import datetime
from http.client import HTTPException
import os
import re
from xml.dom import ValidationErr
from fastapi.security import OAuth2PasswordBearer
from fastapi import APIRouter, Depends, Form, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from chatbot.services.stream_service import event_stream
from chatbot.middleware.jwt import verify_access_token
from dotenv import load_dotenv
from chatbot.database.database import db
from openai import OpenAI
from chatbot.models.request.ai import AskAiRequest, CancelRun, ListRuns, SubmitToolResponse
from chatbot.models.message import Message
from bson import ObjectId
import asyncio

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
load_dotenv()
openai = OpenAI()
router = APIRouter()


async def save_assistant_message_to_db(thread_id, content):
    """Save the assistant's message to the MongoDB conversation"""
    conversation = await db['conversations'].find_one({"threadId": thread_id})
    if conversation:
        message = Message(
            role="assistant",
            content=content,
            timestamp=datetime.utcnow()
        )
        
        # Add the message to the conversation
        await db['conversations'].update_one(
            {"threadId": thread_id},
            {
                "$push": {"messages": message.dict(by_alias=True)},
                "$set": {"lastUpdated": datetime.utcnow()}
            }
        )
        return True
    return False


async def process_stream_for_db(thread_id, stream):
    """Process the streaming response and save the complete message to MongoDB"""
    full_content = ""
    
    async for chunk in stream:
        if hasattr(chunk, 'data') and hasattr(chunk.data, 'content'):
            if len(chunk.data.content) > 0:
                content_chunk = chunk.data.content[0].text.value
                full_content += content_chunk
                
        # Yield the chunk to continue streaming to the client
        yield chunk
    
    # Once streaming is complete, save the full message to the database
    regex_pattern = r"【.*?】"
    cleaned_content = re.sub(regex_pattern, '', full_content)
    await save_assistant_message_to_db(thread_id, cleaned_content)


async def modified_event_stream(stream, thread_id):
    """Modified event stream that aggregates the response for DB storage"""
    full_content = ""
    
    # Create a wrapper to handle the stream and collect content
    def stream_and_collect():
        # Use a regular for loop since event_stream returns a regular generator
        for chunk in event_stream(stream):
            # For debugging
            # print(f"Chunk: {chunk}")
            yield chunk
    
    # Return the generator that will be used by StreamingResponse
    generator = stream_and_collect()
    
    # We need to yield all chunks before saving to the database
    # This generator will be consumed by StreamingResponse
    for chunk in generator:
        yield chunk
    
    # After streaming completes, get the full message from OpenAI
    # We need to use asyncio.sleep to ensure the stream has completed
    # before we try to get the message
    await asyncio.sleep(1)  # Small delay to ensure stream completion
    
    messages = openai.beta.threads.messages.list(
        thread_id=thread_id
    )
    
    if messages.data:
        regex_pattern = r"【.*?】"
        response_text = messages.data[0].content[0].text.value
        cleaned_string = re.sub(regex_pattern, '', response_text)
        
        # Save the complete message to the database
        await save_assistant_message_to_db(thread_id, cleaned_string)


@router.post("/ask-openai-assistant")
async def ask_ai(request: AskAiRequest):
    try:
        # Note: using request.assistantId as defined in your model
        assistant = await db['assistants'].find_one({"openaiAssistantId": request.assistantId})
        if not assistant:
            return JSONResponse(status_code=404, content={"detail": "Assistant not found"})

        if request.runId:
            run = openai.beta.threads.runs.retrieve(
                thread_id=request.threadId,
                run_id=request.runId
            )

            if run.status in ['queued', 'in_progress', 'requires_action']:
                stream = openai.beta.threads.runs.cancel(
                    thread_id=request.threadId,
                    run_id=request.runId,
                )

        # Create a new user message
        user_message = Message(
            role="user",
            content=request.question,
            timestamp=datetime.utcnow()
        )
        
        # Add the user message to the conversation
        await db['conversations'].update_one(
            {"threadId": request.threadId},
            {
                "$push": {"messages": user_message.dict(by_alias=True)},
                "$set": {"lastUpdated": datetime.utcnow()}
            }
        )

        # Send message to OpenAI
        openai.beta.threads.messages.create(
            thread_id=request.threadId,
            role="user",
            content=request.question
        )

        instructions = assistant.get('preprompt', '')

        if request.stream:
            stream = openai.beta.threads.runs.create(
                thread_id=request.threadId,
                assistant_id=request.assistantId,
                instructions=instructions,
                temperature=0,
                stream=True,
                tools=assistant.get('tools', {}),
                include=["step_details.tool_calls[*].file_search.results[*].content"]
            )
            
            # Create a background task to save the message after streaming completes
            async def save_message_after_streaming():
                # Wait for streaming to complete (reasonable timeout)
                await asyncio.sleep(10)  # Adjust timeout as needed
                
                # Get the complete message
                messages = openai.beta.threads.messages.list(
                    thread_id=request.threadId
                )
                
                if messages.data:
                    regex_pattern = r"【.*?】"
                    response_text = messages.data[0].content[0].text.value
                    cleaned_string = re.sub(regex_pattern, '', response_text)
                    
                    # Save the complete message to the database
                    await save_assistant_message_to_db(request.threadId, cleaned_string)
            
            # Start the background task
            asyncio.create_task(save_message_after_streaming())
            
            # Return the streaming response directly using the original event_stream
            return StreamingResponse(
                event_stream(stream), 
                media_type="text/event-stream"
            )
        
        else:
            run = openai.beta.threads.runs.create_and_poll(
                thread_id=request.threadId,
                assistant_id=request.assistantId,
                model=request.model,
                instructions=instructions,
                temperature=0,
                tools=assistant.get('tools', {})
            )
            if run.status == 'completed': 
                messages = openai.beta.threads.messages.list(
                    thread_id=request.threadId
                )
                regex_pattern = r"【.*?】"
                response_text = messages.data[0].content[0].text.value
                cleaned_string = re.sub(regex_pattern, '', response_text)
                
                # Save the assistant's response to the database
                await save_assistant_message_to_db(request.threadId, cleaned_string)
                
                return {"response": cleaned_string}
            else:
                print(run.status)
                return JSONResponse(
                    status_code=422,
                    content={"detail": "AI processing not completed", "status": run.status}
                )

    except Exception as e:
        print(e)
        return JSONResponse(status_code=500, content={"detail": str(e)})