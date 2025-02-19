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

class UserAuth(BaseModel):
    email: str
    name: Optional[str] = None
    language: str

class CodeLogin(BaseModel):
    code: str

class LanguageUpdate(BaseModel):
    language: str
    
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
                "language": user_data.language,
                "role": "user",
                "conversations": []
            }
            
            result = await collection.insert_one(new_user)
            new_user['_id'] = result.inserted_id
            user = User.parse_obj(new_user)
        
        access_token = create_access_token(data={"code": user.code})
        
        return {
            "access_token": access_token,
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/login/code", response_model=Dict[str, Any])
async def login_with_code(login_data: CodeLogin):
    try:
        user = await db['users'].find_one({"code": login_data.code})
        if user is None:
            raise HTTPException(status_code=404, detail="Invalid code")
        
        # Generate JWT token
        access_token = create_access_token(data={"code": login_data.code})
        user_response = User.parse_obj(user)
        
        return {
            "access_token": access_token,
            "user": user_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/user", response_model=User)
async def create_user(user_data: UserCreate):
    try:
        collection = db['users'] 
        
        user_dict = {
            "language": 'English',
            "role": user_data.role,
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

@router.post("/login", response_model=Dict[str, Any])
async def check_user_code(code: str = Body(..., embed=True)):
    user = await db['users'].find_one({"code": code}) 
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate JWT token
    access_token = create_access_token(data={"code": code})
    user_response = User(**user)
    
    return {
        "access_token": access_token,
        "user": user_response
    }

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
    
@router.patch("/user/{user_id}/language")
async def update_user_language(user_id: str, language_data: LanguageUpdate):
    try:
        # Validate user exists
        user = await db['users'].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if the language is actually changing
        if user.get('language') == language_data.language:
            # If language is the same, just return the current user
            return User(**user)
        
        # Update the language field
        result = await db['users'].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"language": language_data.language}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Get updated user
        updated_user = await db['users'].find_one({"_id": ObjectId(user_id)})
        return User(**updated_user)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))