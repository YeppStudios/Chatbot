# backend/chatbot/routes/pdf_routes.py (update)
import os
import shutil
import traceback
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, Form, Depends
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from chatbot.models.pdf_file import PDFFile
from chatbot.database.database import db
from chatbot.services.text_extract.pdf_extractor import PDFExtractor
from chatbot.services.text_extract.text_splitter import text_splitter
from chatbot.services.retrieval.vectorstores.pinecone.upsert import upsert_chunks as pinecone_upsert_chunks
from fastapi.security import OAuth2PasswordBearer
from chatbot.middleware.jwt import verify_access_token

router = APIRouter()
PDF_STORAGE_PATH = os.getenv("PDF_STORAGE_PATH", "./uploaded_pdfs")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Ensure the PDF storage directory exists
os.makedirs(PDF_STORAGE_PATH, exist_ok=True)

@router.post("/pdf", response_model=PDFFile)
async def upload_pdf(
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme)
):
    """Upload a PDF file, process it for the RAG system, and store metadata."""
    user_id = verify_access_token(token)
    
    # Validate file format
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be PDF format")
    
    # Check file size before processing (10MB limit)
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    file_size = 0
    try:
        # Get file size by reading a small chunk first to get content-length
        chunk = await file.read(1024)
        file_size = file.size
        await file.seek(0)  # Reset file position
        
        if file_size > MAX_SIZE:
            raise HTTPException(
                status_code=413,  # Payload Too Large
                detail=f"File size exceeds maximum limit of 10MB (uploaded: {file_size / (1024 * 1024):.2f}MB)"
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error checking file size: {str(e)}")
    
    # Save file to disk
    file_path = os.path.join(PDF_STORAGE_PATH, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Extract text from PDF
    try:
        extractor = PDFExtractor()
        with open(file_path, "rb") as pdf_file:
            extracted_text = extractor.extract_text(pdf_file)
        
        # Check if text extraction was successful
        if not extracted_text or len(extracted_text.strip()) < 50:  # Minimal text threshold
            # Clean up the file as it's not usable
            if os.path.exists(file_path):
                os.remove(file_path)
                
            raise HTTPException(
                status_code=422,  # Unprocessable Entity
                detail="The PDF contains insufficient text for processing. The file may be image-only, scanned poorly, or encrypted."
            )
        
        # Process for RAG (chunking and vectorization)
        chunks = text_splitter(extracted_text)

        print(f"Created {len(chunks)} chunks from PDF '{file.filename}'")
        
        if not chunks or len(chunks) == 0:
            # Clean up the file as it's not usable
            if os.path.exists(file_path):
                os.remove(file_path)
                
            raise HTTPException(
                status_code=422,
                detail="Could not extract meaningful chunks from the document. The text might be too short or formatted unusually."
            )
        
        # Prepare chunk tuples with filename
        chunk_tuples = [(chunk, file.filename) for chunk in chunks]
        
        print(f"First chunk: {chunks[0][:100]}...")
        print(f"Adding filename '{file.filename}' to each chunk's metadata")

        # Upsert to Pinecone
        pinecone_upsert_chunks(
            chunks=chunk_tuples, 
            index_name="courses",  # Use your existing index
            namespace="pdf_files"  
        )
        
        # Save file metadata to MongoDB
        pdf_file = PDFFile(
            name=file.filename,
            size=file_size,
            date_added=datetime.utcnow(),
            user_id=user_id,
            vectorized=True,
            path=file_path,
            active=True 
        )
        
        result = await db['pdf_files'].insert_one(pdf_file.dict(by_alias=True))
        pdf_file.id = result.inserted_id
        
        return pdf_file
    
    except Exception as e:
        # Clean up file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
            
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

@router.get("/pdfs")
async def list_pdfs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: Optional[str] = "date_added",
    sort_order: Optional[int] = -1,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    size_min: Optional[int] = None,
    size_max: Optional[int] = None,
    token: str = Depends(oauth2_scheme)
):
    """List PDF files with filtering and pagination."""
    verify_access_token(token)
    
    skip = (page - 1) * limit
    
    # Build query with filters
    query = {}
    
    # Text search filter
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    # Date range filter
    date_filter = {}
    if date_start:
        try:
            start_date = datetime.fromisoformat(date_start)
            date_filter["$gte"] = start_date
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid start date format: {date_start}")
    
    if date_end:
        try:
            end_date = datetime.fromisoformat(date_end)
            date_filter["$lte"] = end_date
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid end date format: {date_end}")
    
    if date_filter:
        query["date_added"] = date_filter
    
    # File size filter
    size_filter = {}
    if size_min is not None:
        size_filter["$gte"] = size_min
    
    if size_max is not None:
        size_filter["$lte"] = size_max
    
    if size_filter:
        query["size"] = size_filter
    
    # Set sort options
    sort_options = {sort_by: sort_order}
    
    # Print query for debugging
    print(f"PDF filter query: {query}")
    
    # Get paginated list of PDFs
    cursor = db['pdf_files'].find(query).sort(sort_options).skip(skip).limit(limit)
    pdf_files = await cursor.to_list(length=limit)
    
    # Get total count for pagination
    total_count = await db['pdf_files'].count_documents(query)
    
    # Convert ObjectId to string and datetime to ISO format string
    for pdf in pdf_files:
        pdf["_id"] = str(pdf["_id"])
        if "date_added" in pdf and isinstance(pdf["date_added"], datetime):
            pdf["date_added"] = pdf["date_added"].isoformat()
    
    # Return a regular dictionary
    return {
        "pdf_files": pdf_files,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit  # Ceiling division
    }

@router.put("/pdf/{pdf_id}")
async def rename_pdf(
    pdf_id: str,
    new_name: str = Form(...),
    token: str = Depends(oauth2_scheme)
):
    """Rename a PDF file."""
    verify_access_token(token)
    
    # Validate PDF ID
    if not ObjectId.is_valid(pdf_id):
        raise HTTPException(status_code=400, detail="Invalid PDF ID")
    
    # Find the PDF file
    pdf_file = await db['pdf_files'].find_one({"_id": ObjectId(pdf_id)})
    if not pdf_file:
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    # Update the name
    result = await db['pdf_files'].update_one(
        {"_id": ObjectId(pdf_id)},
        {"$set": {"name": new_name}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update PDF name")
    
    # Return the updated PDF file
    updated_pdf = await db['pdf_files'].find_one({"_id": ObjectId(pdf_id)})
    updated_pdf["_id"] = str(updated_pdf["_id"])
    
    return updated_pdf

@router.delete("/pdf/{pdf_id}")
async def delete_pdf(
    pdf_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Delete a PDF file and its vectors from Pinecone."""
    verify_access_token(token)
    
    # Validate PDF ID
    if not ObjectId.is_valid(pdf_id):
        raise HTTPException(status_code=400, detail="Invalid PDF ID")
    
    # Find the PDF file
    pdf_file = await db['pdf_files'].find_one({"_id": ObjectId(pdf_id)})
    if not pdf_file:
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    # Delete file from storage
    if "path" in pdf_file and os.path.exists(pdf_file["path"]):
        try:
            os.remove(pdf_file["path"])
        except Exception as e:
            print(f"Warning: Failed to delete file from disk: {str(e)}")
    
    # Delete metadata from MongoDB
    result = await db['pdf_files'].delete_one({"_id": ObjectId(pdf_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete PDF file")
    
    return {"message": "PDF file deleted successfully"}

@router.get("/pdf/{pdf_id}/download")
async def download_pdf(
    pdf_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Download the original PDF file."""
    verify_access_token(token)
    
    # Validate PDF ID
    if not ObjectId.is_valid(pdf_id):
        raise HTTPException(status_code=400, detail="Invalid PDF ID")
    
    # Find the PDF file
    pdf_file = await db['pdf_files'].find_one({"_id": ObjectId(pdf_id)})
    if not pdf_file:
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    # Check if file exists on disk
    if "path" not in pdf_file or not os.path.exists(pdf_file["path"]):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    
    # Return the file with appropriate headers
    return FileResponse(
        path=pdf_file["path"],
        filename=pdf_file["name"],
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{pdf_file['name']}\""}
    )

@router.put("/pdf/{pdf_id}/toggle-active")
async def toggle_pdf_active(
    pdf_id: str,
    request: dict,  # Will contain { "active": true/false }
    token: str = Depends(oauth2_scheme)
):
    """Toggle whether a PDF is active in conversations"""
    verify_access_token(token)
    
    # Validate PDF ID
    if not ObjectId.is_valid(pdf_id):
        raise HTTPException(status_code=400, detail="Invalid PDF ID")
    
    # Validate request
    if "active" not in request:
        raise HTTPException(status_code=400, detail="'active' field is required")
    
    active_status = bool(request["active"])
    
    # Find the PDF file
    pdf_file = await db['pdf_files'].find_one({"_id": ObjectId(pdf_id)})
    if not pdf_file:
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    # Update the active status
    result = await db['pdf_files'].update_one(
        {"_id": ObjectId(pdf_id)},
        {"$set": {"active": active_status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update PDF active status")
    
    # If setting to inactive, remove vectors from Pinecone
    if not active_status:
        try:
            from chatbot.database.datastore.pinecone_datastore import PineconeDataStore
            datastore = PineconeDataStore()
            
            # Define filter to find vectors with this filename
            file_filter = {"filename": pdf_file["name"]}
            
            # Delete vectors from the pdf_files namespace
            await datastore.delete(filter=file_filter)
            
            print(f"Removed vectors for inactive file: {pdf_file['name']}")
        except Exception as e:
            print(f"Warning: Failed to remove vectors for inactive file: {str(e)}")
    
    # If setting to active, we'll need to re-vectorize the file
    if active_status and os.path.exists(pdf_file.get("path", "")):
        try:
            # Re-vectorize the file
            from chatbot.services.text_extract.pdf_extractor import PDFExtractor
            from chatbot.services.text_extract.text_splitter import text_splitter
            from chatbot.services.retrieval.vectorstores.pinecone.upsert import upsert_chunks as pinecone_upsert_chunks
            
            extractor = PDFExtractor()
            with open(pdf_file["path"], "rb") as file:
                extracted_text = extractor.extract_text(file)
            
            chunks = text_splitter(extracted_text)
            
            # Prepare chunk tuples with filename
            chunk_tuples = [(chunk, pdf_file["name"]) for chunk in chunks]
            
            # Upsert to Pinecone
            pinecone_upsert_chunks(
                chunks=chunk_tuples, 
                index_name="courses",  # Use your existing index
                namespace="pdf_files"  
            )
            
            print(f"Re-vectorized active file: {pdf_file['name']}")
        except Exception as e:
            print(f"Warning: Failed to re-vectorize file: {str(e)}")
    
    # Return the updated PDF file
    updated_pdf = await db['pdf_files'].find_one({"_id": ObjectId(pdf_id)})
    updated_pdf["_id"] = str(updated_pdf["_id"])
    
    return updated_pdf

# In backend/chatbot/routes/pdf_routes.py

@router.get("/pdf-vectors-test")
async def test_pdf_vectors(
    query: str = Query(..., description="Search query to test"),
    token: str = Depends(oauth2_scheme)
):
    """Test endpoint to verify PDF vectors in Pinecone."""
    verify_access_token(token)
    
    # Test searching in pdf_files namespace
    try:
        from chatbot.services.retrieval.vectorstores.pinecone.query import PineconeQuery
        from chatbot.services.openai_service import get_embeddings
        import traceback
        
        # Get embeddings for the query
        query_embeddings = get_embeddings([query])
        
        # Define Pinecone query
        pinecone_query = PineconeQuery(
            index_name="courses",  # Use your index name
            namespace="pdf_files"  # Specifically target the PDF namespace
        )
        
        # Make direct query to Pinecone
        top_k = 10  # Get more results for testing
        
        # First, test the wrapper function
        wrapper_results = pinecone_query.query(
            user_query=query,
            top_k=top_k
        )
        
        # Then test direct Pinecone query - but extract only serializable data
        direct_response = pinecone_query.index.query(
            vector=query_embeddings[0],
            top_k=top_k,
            namespace="pdf_files",
            include_metadata=True
        )
        
        # Convert to serializable format
        direct_results = []
        for match in direct_response.matches:
            direct_results.append({
                "id": match.id,
                "score": float(match.score) if hasattr(match, 'score') else 0.0,
                "metadata": dict(match.metadata) if hasattr(match, 'metadata') else {}
            })
        
        # Get stats about the index in a safe, serializable way
        stats_response = pinecone_query.index.describe_index_stats()
        
        # Extract only what we need from stats
        namespaces = {}
        for ns_name, ns_data in stats_response.get("namespaces", {}).items():
            namespaces[ns_name] = {
                "vector_count": ns_data.get("vector_count", 0)
            }
        
        total_vector_count = stats_response.get("total_vector_count", 0)
        
        # Assemble and return diagnostics with only serializable data
        result = {
            "query": query,
            "wrapper_results": wrapper_results,
            "direct_results": direct_results,
            "namespaces": namespaces,
            "vector_count": total_vector_count,
            "diagnostics": {
                "pdf_namespace_exists": "pdf_files" in namespaces,
                "pdf_vector_count": namespaces.get("pdf_files", {}).get("vector_count", 0),
                "wrapper_result_count": len(wrapper_results),
                "direct_result_count": len(direct_results)
            }
        }
        
        return result
    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }