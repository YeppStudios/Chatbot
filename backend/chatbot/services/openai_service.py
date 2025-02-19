from typing import List
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-large")
EMBEDDING_DIMENSION = int(os.environ.get("EMBEDDING_DIMENSION", 256))

client = OpenAI()


def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Embed texts using OpenAI's embedding model.

    Args:
        texts: The list of texts to embed.

    Returns:
        A list of embeddings, each of which is a list of floats.

    Raises:
        Exception: If the OpenAI API call fails.
    """

    response = client.embeddings.create(
        input=texts, model=EMBEDDING_MODEL, dimensions=EMBEDDING_DIMENSION
    )
    data = response.data

    return [result.embedding for result in data]
