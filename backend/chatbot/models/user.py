from typing import List, Optional
from .utils import PyObjectId
from pydantic import BaseModel, Field
from bson import ObjectId

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    name: Optional[str] = None
    email: Optional[str] = None
    role: str
    conversations: List[str] = []

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: lambda oid: str(oid)
        }
