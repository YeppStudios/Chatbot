from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from .utils import PyObjectId

class PDFFile(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    name: str
    size: int
    date_added: datetime = datetime.utcnow()
    user_id: Optional[str] = None
    vectorized: bool = False
    path: Optional[str] = None
    active: bool = True  # Default to active
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: lambda oid: str(oid),
            datetime: lambda dt: dt.isoformat()
        }