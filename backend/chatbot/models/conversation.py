from typing import List, Optional
from .utils import PyObjectId
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from chatbot.models.message import Message

class Conversation(BaseModel):
    user: PyObjectId
    threadId: Optional[str] = None #for openai assistants
    assistantId: Optional[str] = None #for openai assistants
    messages: List[Message] = [] 
    startTime: datetime 
    lastUpdated: datetime 
    title: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: lambda oid: str(oid),
            datetime: lambda dt: dt.isoformat()
        }
        populate_by_name = True