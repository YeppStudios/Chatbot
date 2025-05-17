from pydantic import BaseModel
from typing import Optional

class ConversationCreateRequest(BaseModel):
    userId: str
    assistantId: Optional[str] = None 
    title: str
    text: Optional[str] = None