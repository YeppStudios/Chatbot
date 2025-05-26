# chatbot/services/vector_search.py
from typing import List, Dict, Any
from chatbot.services.retrieval.vectorstores.pinecone.query import PineconeQuery
from chatbot.services.retrieval.vectorstores.weaviate.query import WeaviateQuery
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
from chatbot.database.database import db
import logging

# Configure logger for vector search
logger = logging.getLogger("vector_search")
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
        logger.info(f"Starting vector search for query: '{query}' with config: {vector_config.model_dump()}")
        
        if vector_config.store_type == "pinecone":
            if not vector_config.index_name:
                raise HTTPException(status_code=400, detail="index_name is required for Pinecone search")
            
            pinecone_query = PineconeQuery(
                index_name=vector_config.index_name,
                namespace=vector_config.namespace
            )
            
            # Search in multiple namespaces if not specified
            if not vector_config.namespace:
                logger.info("No specific namespace provided, searching in both default and pdf_files namespaces")
                # Combine results from main namespace and pdf_files namespace
                results = []
                
                # Search in default namespace
                logger.info("Searching in default namespace...")
                main_results = pinecone_query.query(
                    user_query=query,
                    top_k=vector_config.top_k
                )
                logger.info(f"Found {len(main_results)} results in default namespace")
                for i, result in enumerate(main_results):
                    logger.info(f"  Default[{i+1}]: score={result['score']:.4f}, file={result.get('filename', 'unknown')}")
                    logger.info(f"    Text preview: {result['text'][:150]}...")
                results.extend(main_results)
                
                # Search in pdf_files namespace
                logger.info("Searching in pdf_files namespace...")
                pinecone_query_pdf = PineconeQuery(
                    index_name=vector_config.index_name,
                    namespace="pdf_files"
                )
                pdf_results = pinecone_query_pdf.query(
                    user_query=query,
                    top_k=vector_config.top_k
                )
                logger.info(f"Found {len(pdf_results)} results in pdf_files namespace")
                
                # Filter results from pdf_files namespace based on active status
                filtered_pdf_results = []
                for i, result in enumerate(pdf_results):
                    logger.info(f"  PDF[{i+1}]: score={result['score']:.4f}, file={result.get('filename', 'unknown')}")
                    logger.info(f"    Text preview: {result['text'][:150]}...")
                    
                    if "filename" in result:
                        # Check if the source PDF is active
                        pdf_file = await db['pdf_files'].find_one({"name": result["filename"]})
                        if pdf_file and pdf_file.get("active", True):  # Default to active if not specified
                            filtered_pdf_results.append(result)
                            logger.info(f"    ✓ PDF file '{result['filename']}' is active, including result")
                        else:
                            logger.info(f"    ✗ PDF file '{result['filename']}' is inactive, excluding result")
                    else:
                        filtered_pdf_results.append(result)
                        logger.info(f"    ✓ No filename metadata, including result")
                
                # Add filtered PDF results
                results.extend(filtered_pdf_results)
                logger.info(f"After filtering, included {len(filtered_pdf_results)} PDF results")
                
                # Sort by relevance score and take top results
                results.sort(key=lambda x: x["score"], reverse=True)
                final_results = results[:vector_config.top_k]
                logger.info(f"Final results after sorting and limiting to top {vector_config.top_k}:")
                for i, result in enumerate(final_results):
                    logger.info(f"  Final[{i+1}]: score={result['score']:.4f}, file={result.get('filename', 'unknown')}")
                
                return final_results
            else:
                # Use specified namespace
                logger.info(f"Searching in specified namespace: '{vector_config.namespace}'")
                results = pinecone_query.query(
                    user_query=query,
                    top_k=vector_config.top_k
                )
                logger.info(f"Found {len(results)} results in namespace '{vector_config.namespace}'")
                for i, result in enumerate(results):
                    logger.info(f"  Result[{i+1}]: score={result['score']:.4f}, file={result.get('filename', 'unknown')}")
                    logger.info(f"    Text preview: {result['text'][:150]}...")
                return results

    def prepare_context(self, search_results: List[Dict[str, Any]]) -> str:
        """Format search results into a context string for the LLM."""
        logger.info(f"Preparing context from {len(search_results)} search results")
        
        context_parts = []
        total_chars = 0
        
        for i, result in enumerate(search_results):
            filename = result.get('filename', 'unknown')
            text = result['text']
            score = result['score']
            
            context_part = f"[{filename}]: {text}\n"
            context_parts.append(context_part)
            total_chars += len(context_part)
            
            logger.info(f"  Context[{i+1}]: from '{filename}' (score: {score:.4f}, {len(text)} chars)")
        
        final_context = "\n".join(context_parts)
        logger.info(f"Final context prepared: {total_chars} total characters")
        logger.info(f"Context preview (first 300 chars): {final_context[:300]}...")
        
        return final_context
    
    def test_pdf_search(self, query: str, index_name: str = "pdf-vectors"):
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