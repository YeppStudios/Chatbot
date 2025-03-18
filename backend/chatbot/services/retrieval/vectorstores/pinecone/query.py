# chatbot/services/retrieval/vectorstores/pinecone/query.py
from pinecone import Pinecone
from openai import OpenAI
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pinecone = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

class PineconeQuery:
    def __init__(self, index_name: str = None, namespace: str = ""):
        self.index = pinecone.Index(index_name)
        self.namespace = namespace

    def embed_query(self, query: str) -> List[float]:
        try:
            resp = openai.embeddings.create(
                model="text-embedding-3-large",
                input=query
            )
            return resp.data[0].embedding
        except Exception as e:
            print(f"Error extracting embedding: {str(e)}")
            raise

    def query(self, user_query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        query_vector = self.embed_query(user_query)

        try:
            results = self.index.query(
                vector=query_vector,
                top_k=top_k,
                namespace=self.namespace,
                include_metadata=True
            )
            
            results_with_scores = []
            if hasattr(results, 'matches'):
                for match in results.matches:
                    text = match.metadata.get('text', '') if match.metadata else ''
                    filename = match.metadata.get('filename', 'unknown') if match.metadata else 'unknown'
                    score = match.score if hasattr(match, 'score') else 0.0
                    results_with_scores.append({"text": text, "score": score, "filename": filename})
            elif isinstance(results, dict) and 'matches' in results:
                for match in results['matches']:
                    text = match['metadata'].get('text', '') if 'metadata' in match else ''
                    filename = match['metadata'].get('filename', 'unknown') if 'metadata' in match else 'unknown'
                    score = match.get('score', 0.0)
                    results_with_scores.append({"text": text, "score": score, "filename": filename})
            
            return results_with_scores
            
        except Exception as e:
            print(f"Error during Pinecone query: {str(e)}")
            raise