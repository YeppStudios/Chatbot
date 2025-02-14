from typing import Any, Dict, List
from avatar.models.avatar import Avatar
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from avatar.database.database import db
from typing import Optional

class ScriptedResponse(BaseModel):
    question: str
    response: str
class AvatarCreate(BaseModel):
    name: str
    avatarId: str
    openaiAssistantId: str
    voiceId: str
    preprompt: str
    scripts: List[ScriptedResponse] = []
    tools: List[Dict[str, Any]] = []
    summaryRules: Optional[str] = None
    welcomeMessageRules: Optional[str] = None


router = APIRouter()
avatar_collection = db['avatars']

@router.post("/avatar", response_model=Avatar)
async def create_avatar(request: AvatarCreate):
    try:
        avatar_dict = request.dict()
        result = await db['avatars'].insert_one(avatar_dict)
        avatar_dict["id"] = str(result.inserted_id)
        
        return Avatar(**avatar_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/avatar/{avatar_id}", response_model=Avatar)
async def get_avatar(avatar_id: str):
    try:
        avatar = await db['avatars'].find_one({"avatarId": avatar_id})
        if avatar:
            return Avatar(**avatar)
        else:
            raise HTTPException(status_code=404, detail="Avatar not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/avatar/{openaiAssistantId}", response_model=Avatar)
async def update_avatar(openaiAssistantId: str, update_data: Avatar):
    try:
        update_dict = update_data.dict(exclude_unset=True)
        result = await db['avatars'].update_one({"openaiAssistantId": openaiAssistantId}, {"$set": update_dict})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Avatar not found")
        return update_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/avatars/{openaiAssistantId}")
async def delete_avatar(openaiAssistantId: str):
    try:
        result = await db['avatars'].delete_one({"openaiAssistantId": openaiAssistantId})
        if result.deleted_count:
            return {"status": "Avatar deleted"}
        else:
            raise HTTPException(status_code=404, detail="Avatar not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/avatars", response_model=List[Avatar])
async def get_all_avatars():
    try:
        avatars_cursor = db['avatars'].find({})
        avatars = await avatars_cursor.to_list(length=100)
        for avatar in avatars:
            avatar['id'] = str(avatar['_id'])
        return avatars
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check_avatar/{avatar_id}")
async def check_avatar_exists(avatar_id: str = Path(..., description="The avatar ID to check")):
    if not ObjectId.is_valid(avatar_id):
        return {"exists": False}
    
    avatar_object_id = ObjectId(avatar_id)
    avatar = await avatar_collection.find_one({"_id": avatar_object_id})
    return {"exists": bool(avatar)}

@router.post("/avatars/{avatar_id}/scripts", response_model=Avatar)
async def add_script(avatar_id: str, script):
    avatar = await avatar_collection.find_one({"avatarId": avatar_id})
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    new_script = ScriptedResponse(question=script.question, response=script.response)
    
    await avatar_collection.update_one(
        {"avatarId": avatar_id},
        {"$push": {"scripts": new_script.dict()}}
    )
    
    updated_avatar = await avatar_collection.find_one({"avatarId": avatar_id})
    return Avatar(**updated_avatar)

@router.get("/avatars/{avatar_id}/scripts", response_model=List[ScriptedResponse])
async def get_scripts(avatar_id: str):
    avatar = await avatar_collection.find_one({"avatarId": avatar_id})
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return avatar.get("scripts", [])

@router.delete("/avatars/{avatar_id}/scripts/{question}", response_model=Avatar)
async def delete_script(avatar_id: str, question: str):
    avatar = await avatar_collection.find_one({"avatarId": avatar_id})
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    result = await avatar_collection.update_one(
        {"_id": ObjectId(avatar_id)},
        {"$pull": {"scripts": {"question": question}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Script not found")
    
    updated_avatar = await avatar_collection.find_one({"_id": ObjectId(avatar_id)})
    return Avatar(**updated_avatar)

class PrepromptVariableUpdate(BaseModel):
    preprompt_variable: str


@router.patch("/avatars/{openai_assistant_id}/preprompt-variable")
async def update_preprompt_variable(openai_assistant_id: str, update: PrepromptVariableUpdate):
    try:
        result = await avatar_collection.update_one(
            {"openaiAssistantId": openai_assistant_id},
            {"$set": {"preprompt_variable": update.preprompt_variable}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Avatar not found")

        return {"message": "Preprompt variable updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))