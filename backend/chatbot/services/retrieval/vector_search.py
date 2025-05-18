# chatbot/services/vector_search.py
from typing import List, Dict, Any
from chatbot.services.retrieval.vectorstores.pinecone.query import PineconeQuery
from chatbot.services.retrieval.vectorstores.weaviate.query import WeaviateQuery
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
from chatbot.database.database import db
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

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
            
            # Search in multiple namespaces if not specified
            if not vector_config.namespace:
                # Combine results from main namespace and pdf_files namespace
                results = []
                
                # Search in default namespace
                main_results = pinecone_query.query(
                    user_query=query,
                    top_k=vector_config.top_k
                )
                results.extend(main_results)
                
                # Search in pdf_files namespace
                pinecone_query_pdf = PineconeQuery(
                    index_name=vector_config.index_name,
                    namespace="pdf_files"
                )
                pdf_results = pinecone_query_pdf.query(
                    user_query=query,
                    top_k=vector_config.top_k
                )
                
                # Filter results from pdf_files namespace based on active status
                filtered_pdf_results = []
                for result in pdf_results:
                    if "filename" in result:
                        # Check if the source PDF is active
                        pdf_file = await db['pdf_files'].find_one({"name": result["filename"]})
                        if pdf_file and pdf_file.get("active", True):  # Default to active if not specified
                            filtered_pdf_results.append(result)
                
                # Add filtered PDF results
                results.extend(filtered_pdf_results)
                
                # Sort by relevance score and take top results
                results.sort(key=lambda x: x["score"], reverse=True)
                return results[:vector_config.top_k]
            else:
                # Use specified namespace
                results = pinecone_query.query(
                    user_query=query,
                    top_k=vector_config.top_k
                )
                return results

    def prepare_context(self, search_results: List[Dict[str, Any]]) -> str:
        """Format search results into a context string for the LLM."""
        context_parts = []
        for result in search_results:
            context_parts.append(f"[{result.get('filename', 'unknown')}]: {result['text']}\n")
        return "\n".join(context_parts)
    
    def test_pdf_search(self, query: str, index_name: str = "courses"):
        """
        Test function to directly search PDF vectors in Pinecone.
        This bypasses all other logic to check if PDF search works.
        """
        try:
            from chatbot.services.retrieval.vectorstores.pinecone.query import PineconeQuery
            
            # Create a dedicated query just for PDFs
            pinecone_query = PineconeQuery(
                index_name=index_name,
                namespace="pdf_files"
            )
            
            # Perform the query
            logger.info(f"Test PDF search for query: {query}")
            results = pinecone_query.query(
                user_query=query,
                top_k=10
            )
            
            # Log results
            logger.info(f"Test PDF search found {len(results)} results")
            for i, result in enumerate(results[:3]):  # Log first 3
                logger.info(f"Result {i+1}: score={result['score']}, file={result.get('filename', 'unknown')}")
                logger.info(f"  Text: {result['text'][:100]}...")
            
            return results
        except Exception as e:
            logger.error(f"Error in test_pdf_search: {str(e)}")
            return []