from datetime import datetime
from typing import List
from avatar.models.utils import PyObjectId
from pydantic import BaseModel, Field
from bson import ObjectId

class TableSession(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    table_number: int
    user_orders: List[str] = []  # List of order IDs
    status: str = "active"  # active, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}