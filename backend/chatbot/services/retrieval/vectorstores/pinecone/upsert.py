# chatbot/services/retrieval/vectorstores/pinecone/upsert.py
from openai import OpenAI
from pinecone import Pinecone
import uuid
import time
from typing import List, Tuple
from dotenv import load_dotenv
import os

load_dotenv()

openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pinecone = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

def get_pinecone_index(index_name: str, dimension: int = 3072):
    try:
        if not pinecone.has_index(index_name):
            pinecone.create_index(
                name=index_name,
                dimension=dimension,
                metric="cosine",
                spec={"cloud": "aws", "region": "us-east-1"}
            )
            print(f"Created Pinecone index '{index_name}'.")
            time.sleep(10)
        else:
            print(f"Index '{index_name}' already exists.")
        
        return pinecone.Index(index_name)
    
    except Exception as e:
        print(f"Error with Pinecone index: {str(e)}")
        raise

def upsert_chunks(chunks: List[Tuple[str, str]], index_name: str, namespace: str = ""):
    """
    Upsert chunks with associated filenames.
    Args:
        chunks: List of tuples (chunk_text, filename)
        index_name: Name of the Pinecone index
        namespace: Pinecone namespace
    """
    index = get_pinecone_index(index_name=index_name, dimension=3072)

    # Extract chunk texts for embedding
    chunk_texts = [chunk[0] for chunk in chunks]
    embedding_resp = openai.embeddings.create(
        model="text-embedding-3-large",
        input=chunk_texts
    )
    embeddings = [r.embedding for r in embedding_resp.data]

    # Create vectors with metadata including filename
    vectors_to_upsert = []
    for (chunk_text, filename), vector in zip(chunks, embeddings):
        chunk_id = str(uuid.uuid4())
        vectors_to_upsert.append({
            "id": chunk_id,
            "values": vector,
            "metadata": {"text": chunk_text, "filename": filename}
        })
    
    # Batch upsert
    batch_size = 100
    for i in range(0, len(vectors_to_upsert), batch_size):
        batch = vectors_to_upsert[i:i+batch_size]
        index.upsert(vectors=batch, namespace=namespace)
    
    print(f"Successfully upserted {len(chunks)} chunks to Pinecone (index={index_name}, namespace='{namespace}').")