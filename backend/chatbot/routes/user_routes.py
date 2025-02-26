import random
import string
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from chatbot.models.user import User
from chatbot.database.database import db
from chatbot.middleware.jwt import create_access_token, verify_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()
class UserCreate(BaseModel):
    role: str
    email: str

class UserAuth(BaseModel):
    email: str
    name: Optional[str] = None

class CodeLogin(BaseModel):
    code: str

@router.post("/login", response_model=Dict[str, Any])
async def login_user(user_data: UserAuth = Body(...)):
    try:
        collection = db['users']
        
        existing_user = await collection.find_one({"email": user_data.email})
        if existing_user:
            user = User.parse_obj(existing_user)
        else:
            new_user = {
                "name": user_data.name,
                "email": user_data.email,
                "role": "user",
                "conversations": []
            }
            
            result = await collection.insert_one(new_user)
            new_user['_id'] = result.inserted_id
            user = User.parse_obj(new_user)
        access_token = create_access_token(data={"id": str(user.id)})
        
        return {
            "access_token": access_token,
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.post("/user", response_model=User)
async def create_user(user_data: UserCreate):
    try:
        collection = db['users'] 
        
        user_dict = {
            "role": user_data.role,
            "email": user_data.email,
            "conversations": []
        }

        result = await collection.insert_one(user_dict)
        user_dict['id'] = str(result.inserted_id)
        return User.parse_obj(user_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}", response_model=User)
async def get_user(user_id: str):
    try:
        user = await db['users'].find_one({"_id": ObjectId(user_id)})
        if user:
            return User(**user)
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/user/{user_id}", response_model=User)
async def update_user(user_id: str, update_data: User):
    try:
        result = await db['users'].update_one({"_id": ObjectId(user_id)}, {"$set": update_data.dict()})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return update_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/user/{user_id}")
async def delete_user(user_id: str):
    try:
        result = await db['users'].delete_one({"_id": ObjectId(user_id)})  # Ensure await is used here
        if result.deleted_count:
            return {"status": "User deleted"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/check_user/{user_id}")
async def check_user_exists(user_id: str = Path(..., description="The user ID to check"), token: str = Depends(oauth2_scheme)):
    verify_access_token(token)
    
    user_collection = db['users']
    if not ObjectId.is_valid(user_id):
        return {"exists": False}
    
    user_object_id = ObjectId(user_id)
    user = await user_collection.find_one({"_id": user_object_id})
    if user:
        return {"exists": True}
    else:
        return {"exists": False}

    
@router.get("/users", response_model=List[User])
async def get_all_users():
    try:
        users_cursor = db['users'].find({})

        users = await users_cursor.to_list(length=100)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
