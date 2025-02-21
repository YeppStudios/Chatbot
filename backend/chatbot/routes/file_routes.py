import os
from chatbot.models.file import FileModel
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from chatbot.database.database import db
from openai import BaseModel, OpenAI
import shutil

load_dotenv()

openai = OpenAI()
router = APIRouter()

class FileUploadRequest(BaseModel):
    vectorstore_id: str

class VectorStoreRequest(BaseModel):
    name: str
    assistantId: str
    vectorstore_id: str

class DeleteFileRequest(BaseModel):
    vector_id: str
    vectorstore_id: str

class FetchFilesRequest(BaseModel):
    vectorstore_id: str
    page: int = 1
    limit: int = 20

@router.post("/file")
async def upload_file(
    vectorstore_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        temp_file_path = f"{file.filename}"
    
        with open(temp_file_path, "wb") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
        
        with open(temp_file_path, "rb") as temp_file:
            uploaded_file = openai.files.create(
                file=temp_file,
                purpose="assistants"
            )

            vector_file = openai.beta.vector_stores.files.create(
                vector_store_id=vectorstore_id,
                file_id=uploaded_file.id
            )
            
            os.remove(temp_file_path)

            new_file = FileModel(
                vectorId=vector_file.id,
                name=file.filename,
                vectorstore_id=vectorstore_id
            )

            await db['files'].insert_one(new_file.dict())

            return {"file": new_file.dict()}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/vector-store")
async def create_vector_store(request: VectorStoreRequest):
    vector_store = openai.beta.vector_stores.create(
        name=request.name,
        expires_after={
            "anchor": "last_active_at",
            "days": 365
        }
    )
    openai.beta.assistants.update(
        assistant_id=request.assistantId,
        tool_resources={"file_search": {"vector_store_ids": [vector_store.id]}},
    )
    return {"store": vector_store}

@router.post("/fetch-files")
async def list_files(request: FetchFilesRequest):
    skip = (request.page - 1) * request.limit
    try:
        # Define the base query
        query = {}

        if request.vectorstore_id:
            # For any other vectorstore_id, fetch only files with that id
            query = {"vectorstore_id": request.vectorstore_id}
        else:
            # If no vectorstore_id is provided, fetch all files
            query = {}
        
        cursor = db['files'].find(
            query,
            {'_id': 0, 'vectorId': 1, 'name': 1, 'vectorstore_id': 1}
        ).skip(skip).limit(request.limit)
        
        files = await cursor.to_list(length=request.limit)
        return [FileModel(**file) for file in files]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/file")
async def delete_file(request: DeleteFileRequest):
    try:
        openai.beta.vector_stores.files.delete(
            vector_store_id=request.vectorstore_id,
            file_id=request.vector_id
        )

        openai.files.delete(request.vector_id)

        result = await db['files'].delete_one({"vectorId": request.vector_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="File not found in database")

        return JSONResponse(status_code=200, content={"detail": "File deleted successfully"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))