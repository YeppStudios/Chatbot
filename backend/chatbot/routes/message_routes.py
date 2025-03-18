# message_routes.py
from chatbot.models.request.message import MessageCreate, MessageUpdate
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from chatbot.database.database import db
from chatbot.models.message import Message
from fastapi.security import OAuth2PasswordBearer
from chatbot.middleware.jwt import verify_access_token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Create a message
@router.post("/messages", response_model=Message)
async def create_message(
    message: MessageCreate,
    token: str = Depends(oauth2_scheme)
):
    verify_access_token(token)
    
    conversation = await db['conversations'].find_one({"_id": ObjectId(message.conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    new_message = Message(
        role=message.role,
        content=message.content,
        citations=message.citations,
        timestamp=datetime.utcnow(),
        metadata=message.metadata
    )
    
    result = await db['conversations'].update_one(
        {"_id": ObjectId(message.conversation_id)},
        {"$push": {"messages": new_message.dict()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to add message")
    
    # Update conversation lastUpdated timestamp
    await db['conversations'].update_one(
        {"_id": ObjectId(message.conversation_id)},
        {"$set": {"lastUpdated": datetime.utcnow()}}
    )
    
    return new_message

# Read all messages in a conversation
@router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: str,
    token: str = Depends(oauth2_scheme)
):
    verify_access_token(token)
    
    conversation = await db['conversations'].find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return [Message(**msg) for msg in conversation.get('messages', [])]

# Read a specific message
@router.get("/messages/{message_id}", response_model=Message)
async def get_message(
    conversation_id: str,
    message_id: str,
    token: str = Depends(oauth2_scheme)
):
    verify_access_token(token)
    
    conversation = await db['conversations'].find_one({
        "_id": ObjectId(conversation_id),
        "messages.id": ObjectId(message_id)
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Message or conversation not found")
    
    for msg in conversation['messages']:
        if str(msg['id']) == message_id:
            return Message(**msg)
    
    raise HTTPException(status_code=404, detail="Message not found")

# Update a message
@router.put("/messages/{message_id}", response_model=Message)
async def update_message(
    conversation_id: str,
    message_id: str,
    update: MessageUpdate,
    token: str = Depends(oauth2_scheme)
):
    verify_access_token(token)
    
    update_dict = {
        "messages.$.content": update.content,
        "messages.$.metadata": update.metadata
    }
    if update.citations is not None:
        update_dict["messages.$.citations"] = [c.dict() for c in update.citations]
    
    result = await db['conversations'].update_one(
        {
            "_id": ObjectId(conversation_id),
            "messages.id": ObjectId(message_id)
        },
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found or not updated")
    
    # Get updated message
    conversation = await db['conversations'].find_one({"_id": ObjectId(conversation_id)})
    for msg in conversation['messages']:
        if str(msg['id']) == message_id:
            return Message(**msg)

# Delete a message
@router.delete("/messages/{message_id}")
async def delete_message(
    conversation_id: str,
    message_id: str,
    token: str = Depends(oauth2_scheme)
):
    verify_access_token(token)
    
    result = await db['conversations'].update_one(
        {"_id": ObjectId(conversation_id)},
        {"$pull": {"messages": {"id": ObjectId(message_id)}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found or not deleted")
    
    return {"message": "Message deleted successfully"}