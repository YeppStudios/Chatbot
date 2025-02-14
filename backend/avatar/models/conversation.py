from .utils import PyObjectId
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from typing import Optional

class Conversation(BaseModel):
    threadId: str
    user: PyObjectId
    assistantId: str
    startTime: datetime 
    lastUpdated: datetime 
    title: str
    previousConversationSummary: Optional[str] = None
    greetingMessage: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: lambda oid: str(oid),
            datetime: lambda dt: dt.isoformat()
        }
        allow_population_by_field_name = True