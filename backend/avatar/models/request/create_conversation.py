from pydantic import BaseModel
from typing import Optional

class ConversationCreateRequest(BaseModel):
    userId: str
    text: Optional[str] = None
    assistantId: str
    title: str
