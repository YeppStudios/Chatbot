from avatar.models.avatar import Avatar
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from pinecone import Pinecone
from avatar.database.database import db
import os
import json
from bson import ObjectId

load_dotenv()

openai = OpenAI()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("dishes")
scripted_index = pc.Index("responsescripts")

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




def clean_avatar_data(avatar_data):
    """Convert ObjectId to string in MongoDB document."""
    return {k: str(v) if isinstance(v, ObjectId) else v for k, v in avatar_data.items()}

@router.post("/upsert-script-embeddings/{assistant_id}")
async def process_and_store_script_embeddings(assistant_id: str):
    """Process and store embeddings for a specific avatar's scripted responses."""
    try:
        # Find the specific avatar by OpenAI Assistant ID
        avatar_data = await db['avatars'].find_one({"openaiAssistantId": assistant_id})
        
        if not avatar_data:
            raise HTTPException(
                status_code=404,
                detail=f"Avatar with assistant ID {assistant_id} not found"
            )
            
        # Clean and validate the avatar data
        avatar_data = clean_avatar_data(avatar_data)
        avatar = Avatar(**avatar_data)
        
        if not avatar.scripts:
            return JSONResponse(
                status_code=200,
                content={
                    "message": f"No scripts found for avatar {avatar.avatarId}",
                    "scripts_processed": 0
                }
            )
        
        scripts_processed = 0
        failed_scripts = []
        
        for script in avatar.scripts:
            try:
                # Generate embedding for the question
                question_embedding = await create_embedding(script.question)
                
                # Create a unique ID for the script
                vector_id = f"{avatar.avatarId}_{hash(script.question)}"
                
                # Store script data in metadata
                metadata = {
                    "avatar_id": avatar.avatarId,
                    "avatar_name": avatar.name,
                    "question": script.question,
                    "response": script.response
                }
                
                # Upsert to Pinecone
                scripted_index.upsert(
                    vectors=[{
                        "id": vector_id,
                        "values": question_embedding,
                        "metadata": metadata
                    }],
                    namespace=avatar.avatarId
                )
                
                scripts_processed += 1
                
            except Exception as e:
                failed_scripts.append({
                    "question": script.question,
                    "error": str(e)
                })
                continue
        
        response_content = {
            "avatar_id": avatar.avatarId,
            "scripts_processed": scripts_processed,
            "total_scripts": len(avatar.scripts),
        }
        
        if failed_scripts:
            response_content["failed_scripts"] = failed_scripts
            
        return JSONResponse(
            status_code=200,
            content=response_content
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing avatar scripts: {str(e)}"
        )