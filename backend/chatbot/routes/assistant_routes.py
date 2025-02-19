from typing import Any, Dict, List
from chatbot.models.assistant import Assistant
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from chatbot.database.database import db
from typing import Optional


class AssistantCreate(BaseModel):
    name: str
    assistantId: str
    openaiAssistantId: str
    tools: List[Dict[str, Any]] = []


router = APIRouter()
assistant_collection = db['assistants']

@router.post("/assistant", response_model=Assistant)
async def create_assistant(request: AssistantCreate):
    try:
        assistant_dict = request.dict()
        result = await db['assistants'].insert_one(assistant_dict)
        assistant_dict["id"] = str(result.inserted_id)
        
        return Assistant(**assistant_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assistant/{assistant_id}", response_model=Assistant)
async def get_assistant(assistant_id: str):
    try:
        assistant = await db['assistants'].find_one({"assistantId": assistant_id})
        if assistant:
            return Assistant(**assistant)
        else:
            raise HTTPException(status_code=404, detail="Assistant not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/assistant/{openaiAssistantId}", response_model=Assistant)
async def update_assistant(openaiAssistantId: str, update_data: Assistant):
    try:
        update_dict = update_data.dict(exclude_unset=True)
        result = await db['assistants'].update_one({"openaiAssistantId": openaiAssistantId}, {"$set": update_dict})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Assistant not found")
        return update_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/assistants/{openaiAssistantId}")
async def delete_assistant(openaiAssistantId: str):
    try:
        result = await db['assistants'].delete_one({"openaiAssistantId": openaiAssistantId})
        if result.deleted_count:
            return {"status": "Assistant deleted"}
        else:
            raise HTTPException(status_code=404, detail="Assistant not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assistants", response_model=List[Assistant])
async def get_all_assistants():
    try:
        assistants_cursor = db['assistants'].find({})
        assistants = await assistants_cursor.to_list(length=100)
        for assistant in assistants:
            assistant['id'] = str(assistant['_id'])
        return assistants
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check_assistant/{assistant_id}")
async def check_assistant_exists(assistant_id: str = Path(..., description="The assistant ID to check")):
    if not ObjectId.is_valid(assistant_id):
        return {"exists": False}
    
    assistant_object_id = ObjectId(assistant_id)
    assistant = await assistant_collection.find_one({"_id": assistant_object_id})
    return {"exists": bool(assistant)}


