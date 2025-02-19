from .utils import PyObjectId
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

class Conversation(BaseModel):
    threadId: str
    user: PyObjectId
    assistantId: str
    startTime: datetime 
    lastUpdated: datetime 
    title: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: lambda oid: str(oid),
            datetime: lambda dt: dt.isoformat()
        }
        allow_population_by_field_name = True