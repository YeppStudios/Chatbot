# chatbot/services/retrieval/vectorstores/weaviate/upsert.py
from openai import OpenAI
import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.config import Configure
from typing import List, Tuple
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_weaviate_collection(collection_name: str, dimension: int = 3072):
    try:
        wcd_url = os.getenv("WEAVIATE_URL")
        wcd_api_key = os.getenv("WEAVIATE_API_KEY")
        
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=wcd_url,
            auth_credentials=Auth.api_key(wcd_api_key),
        )
        
        try:
            collection = client.collections.get(collection_name)
            print(f"Collection '{collection_name}' already exists")
        except weaviate.exceptions.WeaviateEntityDoesNotExist:
            print(f"Creating Weaviate collection '{collection_name}'")
            collection = client.collections.create(
                name=collection_name,
                vectorizer_config=Configure.Vectorizer.text2vec_openai(
                    model="text-embedding-3-large",
                    dimensions=dimension
                )
            )
            print(f"Created Weaviate collection '{collection_name}'")
        
        return client, collection
    
    except Exception as e:
        print(f"Error with Weaviate collection: {str(e)}")
        raise

def upsert_chunks(chunks: List[Tuple[str, str]], collection_name: str):
    """
    Upsert chunks with associated filenames.
    Args:
        chunks: List of tuples (chunk_text, filename)
        collection_name: Name of the Weaviate collection
    """
    client, collection = get_weaviate_collection(collection_name=collection_name, dimension=3072)
    
    try:
        chunk_texts = [chunk[0] for chunk in chunks]
        embedding_resp = openai.embeddings.create(
            model="text-embedding-3-large",
            input=chunk_texts
        )
        embeddings = [r.embedding for r in embedding_resp.data]
        
        with collection.batch.dynamic() as batch:
            for (chunk_text, filename), vector in zip(chunks, embeddings):
                chunk_id = str(uuid.uuid4())
                batch.add_object(
                    properties={"text": chunk_text, "filename": filename},
                    vector=vector,
                    uuid=chunk_id
                )
            
            if batch.number_errors > 0:
                print(f"Batch import has {batch.number_errors} errors so far.")
        
        failed_objects = collection.batch.failed_objects
        if failed_objects:
            print(f"Number of failed imports: {len(failed_objects)}")
            print(f"First failed object error: {failed_objects[0]}")
        
        print(f"Successfully upserted {len(chunks)} chunks to Weaviate (collection={collection_name}).")
    
    except Exception as e:
        print(f"Error upserting to Weaviate: {str(e)}")
        raise
    
    finally:
        if client:
            client.close()