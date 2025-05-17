# chatbot/routes/querying_routes.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from chatbot.services.retrieval.vectorstores.pinecone.query import PineconeQuery
from chatbot.services.retrieval.vectorstores.weaviate.query import WeaviateQuery
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Pinecone Request/Response models
class QueryRequest(BaseModel):
    query: str
    index_name: str
    namespace: Optional[str] = ""
    top_k: Optional[int] = 5

class QueryResult(BaseModel):
    text: str
    score: float
    filename: str  # Added filename field

class QueryResponse(BaseModel):
    results: List[QueryResult]

class WeaviateQueryRequest(BaseModel):
    query: str
    collection_name: str
    top_k: Optional[int] = 5

class HybridQueryRequest(BaseModel):
    query: str
    collection_name: str
    top_k: Optional[int] = 5
    alpha: Optional[float] = 0.5
    fusion_type: Optional[str] = None
    query_properties: Optional[List[str]] = None

# Pinecone normal query endpoint
@router.post("/pinecone-query", response_model=QueryResponse)
async def query_pinecone_index(request: QueryRequest):
    try:
        pinecone_query = PineconeQuery(
            index_name=request.index_name,
            namespace=request.namespace
        )
        results = pinecone_query.query(
            user_query=request.query,
            top_k=request.top_k
        )
        return {
            "results": [
                QueryResult(
                    text=result["text"],
                    score=result["score"],
                    filename=result.get("filename", "unknown")
                )
                for result in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/weaviate-query", response_model=QueryResponse)
async def query_weaviate_collection(request: WeaviateQueryRequest):
    weaviate_query = None
    try:
        weaviate_query = WeaviateQuery(collection_name=request.collection_name)
        results = weaviate_query.query(
            user_query=request.query,
            top_k=request.top_k
        )
        return {
            "results": [
                QueryResult(
                    text=result["text"],
                    score=result["score"],
                    filename=result.get("filename", "unknown")
                )
                for result in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if weaviate_query:
            weaviate_query.close()

@router.post("/weaviate-hybrid-query", response_model=QueryResponse)
async def hybrid_query_weaviate_collection(request: HybridQueryRequest):
    weaviate_query = None
    try:
        weaviate_query = WeaviateQuery(collection_name=request.collection_name)
        results = weaviate_query.hybrid_query(
            user_query=request.query,
            top_k=request.top_k,
            alpha=request.alpha,
            fusion_type=request.fusion_type,
            query_properties=request.query_properties
        )
        return {
            "results": [
                QueryResult(
                    text=result["text"],
                    score=result["score"],
                    filename=result.get("filename", "unknown")
                )
                for result in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if weaviate_query:
            weaviate_query.close()