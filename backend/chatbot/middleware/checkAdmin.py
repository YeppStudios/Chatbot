from typing import Dict
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from chatbot.database.database import db
from chatbot.middleware.jwt import verify_access_token
from bson import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_admin_user(token: str) -> Dict[str, str]:
    id = verify_access_token(token)
    print(id)
    user = await db['users'].find_one({"_id": ObjectId(id)})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] != "admin":
        raise HTTPException(status_code=404, detail="You are not authorized to access this endpoint")
    return user
