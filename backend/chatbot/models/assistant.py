from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class Assistant(BaseModel):
    name: str
    openaiAssistantId: str
    preprompt: str
    tools: List[Dict[str, Any]] = []
