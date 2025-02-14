import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Security
import os
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWTError
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256" 
ACCESS_TOKEN_EXPIRE_WEEKS = 1

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(weeks=ACCESS_TOKEN_EXPIRE_WEEKS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_code: str = payload.get("code")
        if user_code is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_code
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

class TokenData(BaseModel):
    code: Optional[str] = None
