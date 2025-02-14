from pydantic import BaseModel
from typing import Optional, List

class AskAiRequest(BaseModel):
    question: str
    model: str
    thread_id: str
    stream: bool
    language: str
    assistant_id: str
    run_id: Optional[str] = None
    call_id: Optional[str] = None


class ListRuns(BaseModel):
    thread_id: str

class CancelRun(BaseModel):
    thread_id: str
    run_id: str

class ToolOutput(BaseModel):
    tool_call_id: str
    output: str 
    
class SubmitToolResponse(BaseModel):
    thread_id: str
    run_id: str
    tool_outputs: List[ToolOutput]
