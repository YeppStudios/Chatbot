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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
load_dotenv()
openai = OpenAI()
router = APIRouter()


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

        openai.beta.threads.messages.create(
            thread_id=request.threadId,
            role="user",
            content=request.question
        )

        await db['conversations'].update_one(
            {"threadId": request.threadId},
            {"$set": {"lastUpdated": datetime.utcnow()}}
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
            return StreamingResponse(event_stream(stream), media_type="text/event-stream")
        
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

