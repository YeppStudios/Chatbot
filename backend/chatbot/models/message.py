from typing import List, Optional
from .utils import PyObjectId
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId


class Citation(BaseModel):
    citation: str  # The citation text
    file_reference: str  # Reference to the file (e.g., file ID or path)

class Message(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    role: str  # "user" or "assistant"
    content: str
    citations: Optional[List[Citation]] = None  # Added citations field
    timestamp: datetime = datetime.utcnow()

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: lambda oid: str(oid),
            datetime: lambda dt: dt.isoformat()
        }