from pydantic import BaseModel, HttpUrl

class PageSettings(BaseModel):
    avatarID: str
    assistantID: str
    voiceID: str
    knowledgebaseID: str
    backgroundUrl: str
    logoUrl: str
    route: str