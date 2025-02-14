from typing import Optional
from pydantic import BaseModel

class FileModel(BaseModel):
    vectorId: str
    name: str
    vectorstore_id: Optional[str] = None