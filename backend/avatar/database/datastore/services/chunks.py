from typing import Dict, List, Optional, Tuple
import uuid
import os
import tiktoken

from avatar.database.datastore.models.models import (
    Document,
    DocumentChunk,
    DocumentChunkMetadata,
)
from avatar.services.openai_service import get_embeddings

tokenizer = tiktoken.get_encoding("cl100k_base")

CHUNK_SIZE = 600
MIN_CHUNK_SIZE_CHARS = 350
MIN_CHUNK_LENGTH_TO_EMBED = 5
MAX_NUM_CHUNKS = 10000
EMBEDDINGS_BATCH_SIZE = int(os.environ.get("OPENAI_EMBEDDING_BATCH_SIZE", 128))


def get_text_chunks(text: str, chunk_token_size: Optional[int]) -> List[str]:
    """
    Splits a text into chunks of ~CHUNK_SIZE tokens, based on punctuation and newline boundaries.

    Args:
        text (str): The text to split into chunks.
        chunk_token_size (int, optional): The target size of each chunk in tokens, or None to use the default CHUNK_SIZE.

    Returns:
        list: A list of text chunks, each of which is a string of ~CHUNK_SIZE tokens.
    """
    if not text or text.isspace():
        return []

    tokens = tokenizer.encode(text, disallowed_special=())
    chunks = []
    chunk_size = chunk_token_size or CHUNK_SIZE
    num_chunks = 0

    while tokens and num_chunks < MAX_NUM_CHUNKS:
        chunk = tokens[:chunk_size]
        chunk_text = tokenizer.decode(chunk)

        if not chunk_text or chunk_text.isspace():
            tokens = tokens[len(chunk) :]
            continue

        # Find the last period or punctuation mark in the chunk
        last_punctuation = max(
            chunk_text.rfind("."),
            chunk_text.rfind("?"),
            chunk_text.rfind("!"),
            chunk_text.rfind("\n"),
        )

        # If there is a punctuation mark, and the last punctuation index is before MIN_CHUNK_SIZE_CHARS then truncate the chunk text at the punctuation mark
        if last_punctuation != -1 and last_punctuation > MIN_CHUNK_SIZE_CHARS:
            chunk_text = chunk_text[: last_punctuation + 1]

        # chunk_text_to_append = chunk_text.replace("\n", " ").strip()
        chunk_text_to_append = chunk_text.strip()

        if len(chunk_text_to_append) > MIN_CHUNK_LENGTH_TO_EMBED:
            chunks.append(chunk_text_to_append)

        tokens = tokens[len(tokenizer.encode(chunk_text, disallowed_special=())) :]
        num_chunks += 1

    if tokens:
        remaining_text = tokenizer.decode(tokens).replace("\n", " ").strip()
        if len(remaining_text) > MIN_CHUNK_LENGTH_TO_EMBED:
            chunks.append(remaining_text)

    return chunks


def create_document_chunks(
    doc: Document, chunk_token_size: Optional[int]
) -> Tuple[List[DocumentChunk], str]:
    """
    Creates a list of document chunks from a document object and returns the document id.

    Args:
        doc (Document): The document object to create chunks from. It should have a text attribute and optionally an id and a metadata attribute.
        chunk_token_size (int, optional): The target size of each chunk in tokens, or None to use the default CHUNK_SIZE.

    Returns:
        tuple: A tuple of (doc_chunks, doc_id), where doc_chunks is a list of document chunks, each of which is a DocumentChunk object with an id, a document_id, a text, and a metadata attribute,
               and doc_id is the id of the document object, generated if not provided. The id of each chunk is generated from the document id and a sequential number, and the metadata is copied from the document object.
    """

    doc_id = doc.id or str(uuid.uuid4())
    if not doc.text or doc.text.isspace():
        return [], doc_id

    text_chunks = get_text_chunks(doc.text, chunk_token_size)

    metadata = (
        DocumentChunkMetadata(**doc.metadata.__dict__)
        if doc.metadata is not None
        else DocumentChunkMetadata()
    )

    metadata.document_id = doc_id
    doc_chunks = []

    for i, text_chunk in enumerate(text_chunks):
        chunk_id = f"{doc_id}_{i}"
        doc_chunk = DocumentChunk(
            id=chunk_id,
            text=text_chunk,
            metadata=metadata,
        )
        doc_chunks.append(doc_chunk)

    return doc_chunks, doc_id


def get_document_chunks(
    documents: List[Document], chunk_token_size: Optional[int]
) -> Dict[str, List[DocumentChunk]]:
    """
    Converts a list of documents into a dictionary from document id to list of document chunks.

    Args:
        documents (list): The list of documents to convert.
        chunk_token_size (int, optional): The target size of each chunk in tokens, or None to use the default CHUNK_SIZE.

    Returns:
        dict: A dictionary mapping each document id to a list of document chunks, each of which is a `DocumentChunk` object
              with text, metadata, and embedding attributes.
    """

    chunks: Dict[str, List[DocumentChunk]] = {}
    all_chunks: List[DocumentChunk] = []

    for doc in documents:
        doc_chunks, doc_id = create_document_chunks(doc, chunk_token_size)
        all_chunks.extend(doc_chunks)

        chunks[doc_id] = doc_chunks

    if not all_chunks:
        return {}

    embeddings: List[List[float]] = []

    for i in range(0, len(all_chunks), EMBEDDINGS_BATCH_SIZE):
        batch_texts = [
            chunk.text for chunk in all_chunks[i : i + EMBEDDINGS_BATCH_SIZE]
        ]

        batch_embeddings = get_embeddings(batch_texts)
        embeddings.extend(batch_embeddings)

    for i, chunk in enumerate(all_chunks):
        chunk.embedding = embeddings[i]

    return chunks
