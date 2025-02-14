from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class ScriptedResponse(BaseModel):
    question: str
    response: str

class Avatar(BaseModel):
    name: str
    avatarId: str
    openaiAssistantId: str
    voiceId: str
    preprompt: str
    preprompt_variable: Optional[str] = ""
    scripts: List[ScriptedResponse] = []
    tools: List[Dict[str, Any]] = []
    summaryRules: Optional[str] = None
    welcomeMessageRules: Optional[str] = None
