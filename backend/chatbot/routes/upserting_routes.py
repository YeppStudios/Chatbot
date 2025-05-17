# chatbot/routes/upserting_routes.py
import asyncio
import os
from chatbot.services.llm.openai import OpenAILLM
from chatbot.services.retrieval.vectorstores.pinecone.upsert import upsert_chunks as pinecone_upsert_chunks
from chatbot.services.retrieval.vectorstores.weaviate.upsert import upsert_chunks as weaviate_upsert_chunks
from chatbot.services.text_extract.text_splitter import text_splitter
from chatbot.services.text_extract.pdf_extractor import PDFExtractor
from chatbot.services.text_extract.txt_extractor import TXTExtractor
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
from io import BytesIO

router = APIRouter()

@router.post("/pinecone-upsert")
async def upload_and_upsert_pinecone(
    file: UploadFile = File(...),
    index_name: str = Form(...),
    namespace: Optional[str] = Form("")
):
    if file.content_type == "application/pdf":
        extractor = PDFExtractor()
    elif file.content_type in ["text/plain", "text/markdown"]:
        extractor = TXTExtractor()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    file_bytes = await file.read()
    extracted_text = extractor.extract_text(BytesIO(file_bytes))
    chunks = text_splitter(extracted_text)
    
    # Create list of (text, filename) tuples
    chunk_tuples = [(chunk, file.filename) for chunk in chunks]

    try:
        pinecone_upsert_chunks(chunks=chunk_tuples, index_name=index_name, namespace=namespace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "ok", "chunks_upserted": len(chunks)}

@router.post("/weaviate-upsert")
async def upload_and_upsert_weaviate(
    file: UploadFile = File(...),
    collection_name: str = Form(...),
):
    if file.content_type == "application/pdf":
        extractor = PDFExtractor()
    elif file.content_type in ["text/plain", "text/markdown"]:
        extractor = TXTExtractor()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    file_bytes = await file.read()
    extracted_text = extractor.extract_text(BytesIO(file_bytes))
    chunks = text_splitter(extracted_text)
    
    # Create list of (text, filename) tuples
    chunk_tuples = [(chunk, file.filename) for chunk in chunks]

    try:
        weaviate_upsert_chunks(chunks=chunk_tuples, collection_name=collection_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "ok", "chunks_upserted": len(chunks)}

@router.post("/pinecone-upsert-with-mini-title")
async def upload_and_upsert_pinecone_with_mini_title(
    file: UploadFile = File(...),
    index_name: str = Form(...),
    namespace: Optional[str] = Form("")
):
    if file.content_type == "application/pdf":
        extractor = PDFExtractor()
    elif file.content_type in ["text/plain", "text/markdown"]:
        extractor = TXTExtractor()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    file_bytes = await file.read()
    extracted_text = extractor.extract_text(BytesIO(file_bytes))
    chunks = text_splitter(extracted_text)

    openai_llm = OpenAILLM(model="gpt-4o-mini")

    async def generate_description(chunk: str) -> str:
        try:
            messages = [
                {"role": "user", "content": f"Provide a short title for this text:\n\n{chunk}"}
            ]
            desc = await openai_llm.generate_response(messages)
            print(f"Title: {desc.strip()}\n")
            print(f"Chunk: {chunk}\n\n")
            return desc.strip()
        except Exception as e:
            print(f"Error generating description: {e}")
            return "No title/description available"

    tasks = [generate_description(chunk) for chunk in chunks]
    descriptions = await asyncio.gather(*tasks)

    # Create enriched chunks with filename
    enriched_chunk_tuples = [(f"{desc}\n\n{chunk}", file.filename) for desc, chunk in zip(descriptions, chunks)]

    try:
        pinecone_upsert_chunks(chunks=enriched_chunk_tuples, index_name=index_name, namespace=namespace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "ok",
        "chunks_upserted": len(chunks),
        "enrichment_added": True
    }

@router.post("/weaviate-upsert-with-mini-title")
async def upload_and_upsert_weaviate_with_mini_title(
    file: UploadFile = File(...),
    collection_name: str = Form(...),
):
    if file.content_type == "application/pdf":
        extractor = PDFExtractor()
    elif file.content_type in ["text/plain", "text/markdown"]:
        extractor = TXTExtractor()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    file_bytes = await file.read()
    extracted_text = extractor.extract_text(BytesIO(file_bytes))
    chunks = text_splitter(extracted_text)

    openai_llm = OpenAILLM(model="gpt-4o-mini")

    async def generate_description(chunk: str) -> str:
        try:
            messages = [
                {"role": "user", "content": f"Provide a short, descriptive title in Polish for this text:\n\n{chunk}"}
            ]
            desc = await openai_llm.generate_response(messages)
            print(f"Title: {desc.strip()}\n")
            print(f"Chunk: {chunk}\n\n")
            return desc.strip()
        except Exception as e:
            print(f"Error generating description: {e}")
            return "No title/description available"

    tasks = [generate_description(chunk) for chunk in chunks]
    descriptions = await asyncio.gather(*tasks)

    # Create enriched chunks with filename
    enriched_chunk_tuples = [(f"{desc}\n\n{chunk}", file.filename) for desc, chunk in zip(descriptions, chunks)]

    try:
        weaviate_upsert_chunks(chunks=enriched_chunk_tuples, collection_name=collection_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "ok",
        "chunks_upserted": len(chunks),
        "enrichment_added": True
    }