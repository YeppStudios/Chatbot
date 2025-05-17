# chatbot/services/retrieval/vectorstores/weaviate/query.py
import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.query import HybridFusion, MetadataQuery
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class WeaviateQuery:
    def __init__(self, collection_name: str):
        wcd_url = os.getenv("WEAVIATE_URL")
        wcd_api_key = os.getenv("WEAVIATE_API_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        self.client = weaviate.connect_to_weaviate_cloud(
            cluster_url=wcd_url,
            auth_credentials=Auth.api_key(wcd_api_key),
            headers={"X-OpenAI-Api-Key": openai_api_key}
        )
        
        self.collection = self.client.collections.get(collection_name)
    
    def query(self, user_query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        try:
            response = self.collection.query.bm25(
                query=user_query,
                limit=top_k,
                return_metadata=MetadataQuery(score=True)  # Request score in metadata
            )
            
            results_with_scores = []
            for obj in response.objects:
                props = obj.properties
                text = props.get('text', '')
                filename = props.get('filename', 'unknown')
                # Use the actual BM25 score from metadata
                score = float(obj.metadata.score) if obj.metadata and obj.metadata.score is not None else 1.0
                results_with_scores.append({"text": text, "score": score, "filename": filename})
            
            return results_with_scores
            
        except Exception as e:
            print(f"Error during Weaviate BM25 query: {str(e)}")
            raise
    
    def hybrid_query(self, 
                    user_query: str, 
                    top_k: int = 5,
                    alpha: float = 0.5,
                    fusion_type: Optional[str] = None,
                    query_properties: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            embedding_response = client.embeddings.create(
                model="text-embedding-3-large",
                input=user_query
            )
            query_vector = embedding_response.data[0].embedding
            
            hybrid_params = {
                "query": user_query,
                "limit": top_k,
                "alpha": alpha,
                "vector": query_vector,
                "return_metadata": MetadataQuery(score=True)  # Request score in metadata
            }
            
            if query_properties:
                hybrid_params["query_properties"] = query_properties
            if fusion_type:
                hybrid_params["fusion_type"] = HybridFusion.RANKED if fusion_type.lower() == "ranked" else HybridFusion.RELATIVE_SCORE
            
            response = self.collection.query.hybrid(**hybrid_params)
            
            results_with_scores = []
            for obj in response.objects:
                props = obj.properties
                text = props.get('text', '')
                filename = props.get('filename', 'unknown')
                # Use the actual hybrid score from metadata
                score = float(obj.metadata.score) if obj.metadata and obj.metadata.score is not None else 1.0
                results_with_scores.append({"text": text, "score": score, "filename": filename})
            
            return results_with_scores
            
        except Exception as e:
            print(f"Error during Weaviate hybrid query: {str(e)}")
            raise
    
    def close(self):
        if hasattr(self, 'client'):
            self.client.close()