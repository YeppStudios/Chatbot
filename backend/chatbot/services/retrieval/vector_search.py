# chatbot/services/vector_search.py
from typing import List, Dict, Any
from chatbot.services.retrieval.vectorstores.pinecone.query import PineconeQuery
from chatbot.services.retrieval.vectorstores.weaviate.query import WeaviateQuery
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Literal, Optional

class VectorStoreConfig(BaseModel):
    store_type: Literal["pinecone", "weaviate"]
    index_name: Optional[str] = None
    namespace: Optional[str] = ""
    collection_name: Optional[str] = None
    hybrid: Optional[bool] = False
    alpha: Optional[float] = 0.5
    fusion_type: Optional[str] = None
    query_properties: Optional[List[str]] = None
    top_k: int = 5

class VectorSearchService:
    async def perform_vector_search(self, query: str, vector_config: VectorStoreConfig) -> List[Dict[str, Any]]:
        """Execute vector search based on the provided configuration."""
        if vector_config.store_type == "pinecone":
            if not vector_config.index_name:
                raise HTTPException(status_code=400, detail="index_name is required for Pinecone search")
            
            pinecone_query = PineconeQuery(
                index_name=vector_config.index_name,
                namespace=vector_config.namespace
            )
            
            results = pinecone_query.query(
                user_query=query,
                top_k=vector_config.top_k
            )
            return results
        
        elif vector_config.store_type == "weaviate":
            if not vector_config.collection_name:
                raise HTTPException(status_code=400, detail="collection_name is required for Weaviate search")
            
            weaviate_query = WeaviateQuery(collection_name=vector_config.collection_name)
            
            try:
                if vector_config.hybrid:
                    results = weaviate_query.hybrid_query(
                        user_query=query,
                        top_k=vector_config.top_k,
                        alpha=vector_config.alpha,
                        fusion_type=vector_config.fusion_type,
                        query_properties=vector_config.query_properties
                    )
                else:
                    results = weaviate_query.query(
                        user_query=query,
                        top_k=vector_config.top_k
                    )
                return results
            finally:
                weaviate_query.close()
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported vector store type: {vector_config.store_type}")

    def prepare_context(self, search_results: List[Dict[str, Any]]) -> str:
        """Format search results into a context string for the LLM."""
        context_parts = []
        for result in search_results:
            context_parts.append(f"[{result.get('filename', 'unknown')}]: {result['text']}\n")
        return "\n".join(context_parts)