from pydantic import BaseModel
from typing import Optional, List

class AskAiRequest(BaseModel):
    question: str
    model: str
    threadId: str
    stream: bool
    language: str
    assistantId: str
    runId: Optional[str] = None
    callId: Optional[str] = None


class ListRuns(BaseModel):
    threadId: str

class CancelRun(BaseModel):
    threadId: str
    runId: str

class ToolOutput(BaseModel):
    toolCallId: str
    output: str 
    
class SubmitToolResponse(BaseModel):
    threadId: str
    runId: str
    toolOutputs: List[ToolOutput]
