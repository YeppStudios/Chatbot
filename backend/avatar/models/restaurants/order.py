from datetime import datetime
from typing import List, Optional
from avatar.models.utils import PyObjectId
from pydantic import BaseModel, Field
from bson import ObjectId

class SingleOrderItem(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')  # Added item ID
    item_name: str
    quantity: int = 1
    notes: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Order(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    user_id: str
    user_name: Optional[str] = None
    items: List[SingleOrderItem]
    status: str = "pending"  # pending, confirmed, preparing, ready, delivered
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}