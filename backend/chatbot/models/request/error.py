from pydantic import BaseModel


class ErrorResponse(BaseModel):
    errorCode: str
    message: str
