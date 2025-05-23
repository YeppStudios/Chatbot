from datetime import datetime
import traceback
from typing import Any, Dict, List, Optional
import re
from chatbot.models.request.conversation import ConversationCreateRequest
from chatbot.models.user import User
from chatbot.models.assistant import Assistant
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from chatbot.database.database import db
from chatbot.models.conversation import Conversation
from chatbot.middleware.checkAdmin import get_current_admin_user
from dotenv import load_dotenv
from bson import ObjectId
from openai import OpenAI
from pydantic import BaseModel
from chatbot.models.message import Message

load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
openai = OpenAI()
router = APIRouter()

@router.get("/threadIds", response_model=List[str])
async def get_conversation_threads(page: int = 1, limit: int = Query(20, gt=0)):
    skip = (page - 1) * limit
    try:
        cursor = db['conversations'].find({'threadId': {'$exists': True}}, {'threadId': 1}).skip(skip).limit(limit)
        threads = await cursor.to_list(length=limit)
        thread_ids = [thread['threadId'] for thread in threads if 'threadId' in thread]
        return thread_ids
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/userConversations", response_model=List[str])
async def get_user_conversations(userId: str = Query(..., description="The unique identifier for the user")):
    user = await db["users"].find_one({"_id": ObjectId(userId)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("conversations", []) 

@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, messageLimit: int = Query(20, ge=1, le=100)):
    try:
        # Find conversation by _id in our database
        try:
            conversation = await db['conversations'].find_one({"_id": ObjectId(conversation_id)})
        except:
            # Try finding by threadId as fallback for backward compatibility
            conversation = await db['conversations'].find_one({"threadId": conversation_id})
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Convert ObjectId to string for serialization
        conversation = serialize_doc(conversation)
        
        # Check if the conversation has messages
        has_messages = 'messages' in conversation and conversation['messages']
        
        # Sort messages by timestamp if they exist
        if has_messages:
            conversation['messages'].sort(key=lambda x: x.get('timestamp', ''))
            
            # Limit the number of messages if needed
            if len(conversation['messages']) > messageLimit:
                conversation['messages'] = conversation['messages'][-messageLimit:]
        else:
            # If no messages in our database but there's a threadId, 
            # try to fetch from OpenAI as fallback (for older conversations)
            if 'threadId' in conversation and conversation['threadId']:
                try:
                    response = openai.beta.threads.messages.list(
                        thread_id=conversation['threadId'],
                        limit=messageLimit
                    )
                    
                    # Convert OpenAI messages to our format and add to conversation
                    messages = []
                    for msg in response.data:
                        if hasattr(msg, 'content') and len(msg.content) > 0:
                            content = msg.content[0].text.value
                            # Clean citations if needed
                            regex_pattern = r"【.*?】"
                            cleaned_content = re.sub(regex_pattern, '', content)
                            
                            messages.append({
                                'role': msg.role,
                                'content': cleaned_content,
                                'timestamp': msg.created_at
                            })
                    
                    # Sort by timestamp
                    messages.sort(key=lambda x: x.get('timestamp', 0))
                    conversation['messages'] = messages
                    
                    # Update conversation in database with messages from OpenAI
                    await db['conversations'].update_one(
                        {"_id": ObjectId(conversation_id)},
                        {"$set": {"messages": messages}}
                    )
                    
                    # Check if we successfully fetched messages
                    has_messages = len(messages) > 0
                except Exception as e:
                    print(f"Could not fetch messages from OpenAI: {str(e)}")
            
            # If we still have no messages after trying OpenAI, return 404
            if not has_messages:
                raise HTTPException(status_code=404, detail="Conversation has no messages")
        
        return conversation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



def serialize_doc(doc):
    """Convert MongoDB document to dict with string IDs."""
    if isinstance(doc, dict):
        return {k: serialize_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, datetime):
        return doc.isoformat()
    return doc

class ConversationResponse(BaseModel):
    conversations: List[Dict[str, Any]]
    total: int

@router.get("/conversations", response_model=ConversationResponse)
async def get_all_conversations(page: int = Query(1, description="Page number, starting from 1"),
                              limit: int = Query(20, description="Number of conversations per page", gt=0),
                              token: str = Depends(oauth2_scheme)):
    await get_current_admin_user(token)
    skip = (page - 1) * limit
    try:
        # Get total count of conversations
        total_count = await db['conversations'].count_documents({})
        
        # Get paginated conversations
        cursor = db['conversations'].find({}).sort('lastUpdated', -1).skip(skip).limit(limit)
        conversations = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for each conversation
        serialized_conversations = [serialize_doc(conv) for conv in conversations]
        
        # Return both the conversations and the total count
        return {
            "conversations": serialized_conversations,
            "total": total_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@router.post("/conversation")
async def create_conversation(request: ConversationCreateRequest):
    try:
        thread = None
        if request.assistantId:
            thread = openai.beta.threads.create()

        user = await db['users'].find_one({"_id": ObjectId(request.userId)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_model = User(**user)

        assistant_model = None
        if request.assistantId:
            print("Fetching assistant with openaiAssistantId:", request.assistantId)
            assistant = await db['assistants'].find_one({"openaiAssistantId": request.assistantId})
            if not assistant:
                raise HTTPException(status_code=404, detail="Assistant not found")
            assistant_model = Assistant(**assistant)

        if thread and assistant_model and assistant_model.preprompt:
            openai.beta.threads.messages.create(
                thread.id,
                role="assistant",
                content=assistant_model.preprompt
            )

        if thread and request.text:
            openai.beta.threads.messages.create(
                thread.id,
                role="assistant",
                content=request.text
            )

        initial_messages = []
        if not thread and request.text:
            message = Message(
                role="assistant",
                content=request.text,
                timestamp=datetime.utcnow()
            )
            initial_messages.append(message)

        new_conversation = Conversation(
            threadId=thread.id if thread else "",  # Use empty string instead of None
            user=request.userId,
            startTime=datetime.utcnow(),
            lastUpdated=datetime.utcnow(),
            assistantId=request.assistantId if request.assistantId else "",  # Use empty string
            title=request.title,
            messages=initial_messages
        )

        result = await db['conversations'].insert_one(new_conversation.model_dump(exclude_none=True))
        new_conversation_dict = new_conversation.model_dump(exclude_none=True)
        new_conversation_dict["_id"] = str(result.inserted_id)

        user_conversations = user_model.conversations or []
        if thread:
            user_conversations.append(thread.id)

        await db['users'].update_one(
            {"_id": ObjectId(request.userId)},
            {"$set": {"conversations": user_conversations}}
        )

        return {
            "thread": thread,
            "conversation": new_conversation_dict
        }
    except Exception as e:
        print("Error in /conversation:", str(e))
        print("Stack trace:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

class PaginationInfo(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_previous: bool

class SortInfo(BaseModel):
    field: str
    order: str

class Conversation(BaseModel):
    _id: str
    threadId: str
    user: str
    startTime: datetime
    lastUpdated: datetime
    assistantId: str
    title: str

class ConversationsResponse(BaseModel):
    data: List[Conversation]
    pagination: PaginationInfo
    sort: SortInfo

@router.get("/assistant/{assistantId}/conversations", response_model=ConversationsResponse)
async def get_assistant_conversations(
    assistantId: str,
    page: int = Query(1, description="Page number, starting from 1", ge=1),
    limit: int = Query(20, description="Number of conversations per page", gt=0, le=100),
    sort_by: str = Query("lastUpdated", description="Sort field (startTime or lastUpdated)"),
    sort_order: int = Query(-1, description="Sort order: -1 for descending, 1 for ascending"),
):
    skip = (page - 1) * limit
    
    try:
        # Validate sort parameters
        valid_sort_fields = ["startTime", "lastUpdated"]
        if sort_by not in valid_sort_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}"
            )
        
        # Build the query
        query = {"assistantId": assistantId}
        
        # Get total count for pagination
        total_count = await db['conversations'].count_documents(query)
        
        # Fetch conversations with pagination and sorting
        cursor = db['conversations'].find(query)\
            .sort(sort_by, sort_order)\
            .skip(skip)\
            .limit(limit)
        
        conversations = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for each conversation
        for conv in conversations:
            conv['_id'] = str(conv['_id'])
        
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_previous = page > 1
        
        return ConversationsResponse(
            data=conversations,
            pagination=PaginationInfo(
                total=total_count,
                page=page,
                limit=limit,
                total_pages=total_pages,
                has_next=has_next,
                has_previous=has_previous
            ),
            sort=SortInfo(
                field=sort_by,
                order="descending" if sort_order == -1 else "ascending"
            )
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching conversations: {str(e)}"
        )
    


@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    try:
        result = await db['conversations'].delete_one({"_id": ObjectId(conversation_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Optionally, remove conversation ID references from user documents
        await db['users'].update_many(
            {"conversations": conversation_id},
            {"$pull": {"conversations": ObjectId(conversation_id)}}
        )

        return {"message": "Conversation deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))