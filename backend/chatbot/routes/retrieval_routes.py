from chatbot.models.assistant import Assistant
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from pinecone import Pinecone
from chatbot.database.database import db
import os
import json
from bson import ObjectId

load_dotenv()

openai = OpenAI()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("dishes")

dishes_collection = db["dishes"]

router = APIRouter()

class Dish(BaseModel):
    dish_name: str
    description: Optional[str] = None
    price: Optional[str] = None
    category: Optional[str] = None
    nutritional_info: Optional[str] = None
    photo_url: Optional[str] = None

def clean_dish_data(dish_data):
    """Convert ObjectId to string in MongoDB document."""
    dish_data = {k: str(v) if isinstance(v, ObjectId) else v for k, v in dish_data.items()}
    return dish_data

async def create_embedding(text: str) -> List[float]:
    """Generate embedding for a given text using OpenAI model."""
    response = openai.embeddings.create(
        input=text,
        model="text-embedding-3-large"
    )
    return response.data[0].embedding

@router.post("/upsert-dishes")
async def process_and_store_dish_embeddings():
    # Fetch all dishes from MongoDB
    dishes_cursor = dishes_collection.find()
    dishes = await dishes_cursor.to_list(length=None)

    # Process each dish as a single chunk
    for dish_data in dishes:
        # Convert ObjectId to string in the dish data
        dish_data = clean_dish_data(dish_data)
        
        # Parse the document into a Dish model
        dish = Dish(**dish_data)
        
        # Convert the dish object to a string for embedding
        dish_text = (
            f"{dish.dish_name}\n"
        )
        
        try:
            # Generate embedding for the dish
            embedding = await create_embedding(dish_text)
            
            # Use MongoDB _id as the vector ID to ensure ASCII compliance
            vector_id = str(dish_data["_id"])
            
            # Upsert data to Pinecone with the serialized JSON object as metadata
            index.upsert(
                vectors=[
                    {
                        "id": vector_id,
                        "values": embedding,
                        "metadata": {
                            "dish_data": json.dumps(dish_data)  # Store the entire dish data as a JSON string
                        }
                    }
                ],
                namespace="ns1"  # Adjust the namespace as needed
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing dish '{dish.dish_name}': {e}")

    return JSONResponse(status_code=200, content={"dishes_processed": len(dishes)})

def clean_assistant_data(assistant_data):
    """Convert ObjectId to string in MongoDB document."""
    return {k: str(v) if isinstance(v, ObjectId) else v for k, v in assistant_data.items()}

@router.post("/upsert-embeddings/{assistant_id}")
async def process_and_store_embeddings(assistant_id: str):
    """Process and store embeddings for a specific assistant's prompt."""
    try:
        # Find the specific assistant by OpenAI Assistant ID
        assistant_data = await db['assistants'].find_one({"openaiAssistantId": assistant_id})
        
        if not assistant_data:
            raise HTTPException(
                status_code=404,
                detail=f"Assistant with ID {assistant_id} not found"
            )
            
        # Clean and validate the assistant data
        assistant_data = clean_assistant_data(assistant_data)
        assistant = Assistant(**assistant_data)
        
        try:
            # Generate embedding for the preprompt if it exists
            if assistant.preprompt:
                preprompt_embedding = await create_embedding(assistant.preprompt)
                
                # Create a unique ID for the embedding
                vector_id = f"{assistant.openaiAssistantId}_preprompt"
                
                # Store assistant data in metadata
                metadata = {
                    "assistant_id": assistant.openaiAssistantId,
                    "assistant_name": assistant.name,
                    "preprompt": assistant.preprompt
                }
                
                # Upsert to Pinecone
                index.upsert(
                    vectors=[{
                        "id": vector_id,
                        "values": preprompt_embedding,
                        "metadata": metadata
                    }],
                    namespace="assistants"
                )
                
            return JSONResponse(
                status_code=200,
                content={
                    "assistant_id": assistant.openaiAssistantId,
                    "message": "Preprompt embedding processed successfully"
                }
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing preprompt: {str(e)}"
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing assistant data: {str(e)}"
        )