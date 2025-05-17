from chatbot.models.message import Citation
from pydantic import BaseModel
from typing import List, Optional


class MessageCreate(BaseModel):
    conversation_id: str
    role: str
    content: str
    citations: Optional[List[Citation]] = None  # Added citations
    metadata: Optional[dict] = None

class MessageUpdate(BaseModel):
    content: str
    citations: Optional[List[Citation]] = None  # Added citations
    metadata: Optional[dict] = None