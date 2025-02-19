from pydantic import BaseModel
from typing import Optional

class ConversationCreateRequest(BaseModel):
    userId: str
    assistantId: str
    title: str
    text: Optional[str] = None
