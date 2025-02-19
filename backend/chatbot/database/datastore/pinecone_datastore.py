import os
from typing import Any, Dict, List, Optional

from tenacity import retry, wait_random_exponential, stop_after_attempt
import asyncio
import logging
from dotenv import load_dotenv
from pinecone import Pinecone
from pinecone.core.client.exceptions import NotFoundException

from .datastore import DataStore
from chatbot.database.datastore.models.models import (
    DocumentChunk,
    DocumentChunkMetadata,
    DocumentChunkWithScore,
    DocumentMetadataFilter,
    QueryResult,
    QueryWithEmbedding,
    Source,
)
from chatbot.database.datastore.services.date import to_unix_timestamp

load_dotenv()

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX = os.environ.get("PINECONE_INDEX")
assert PINECONE_API_KEY is not None
assert PINECONE_INDEX is not None

UPSERT_BATCH_SIZE = 100
EMBEDDING_DIMENSION = int(os.environ.get("EMBEDDING_DIMENSION", 256))

pinecone = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))

class PineconeDataStore(DataStore):
    def __init__(self, index_name: Optional[str] = None):

        self.index = None
        pinecone_index = index_name if index_name is not None else PINECONE_INDEX
        indexes = [item["name"] for item in pinecone.list_indexes()]

        if pinecone_index and pinecone_index not in indexes:
            logging.error(f"Index {pinecone_index} does not exist")
            raise e
        elif pinecone_index and pinecone_index in indexes:
            try:
                logging.info(f"Connecting to existing index {pinecone_index}")
                self.index = pinecone.Index(pinecone_index)
                logging.info(f"Connected to index {pinecone_index} successfully")
            except Exception as e:
                logging.error(f"Error connecting to index {pinecone_index}: {e}")
                raise e

    @retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
    async def _upsert(self, chunks: Dict[str, List[DocumentChunk]]) -> List[str]:
        """Takes in a dict from document id to list of document chunks and inserts them into the index.

        Args:
            chunks (Dict[str, List[DocumentChunk]]): A dict from document id to list of document chunks

        Raises:
            e: Any exception that occurs during the upsert process

        Returns:
            List[str]: A list of upserted document ids
        """

        doc_ids: List[str] = []
        vectors = []

        for doc_id, chunk_list in chunks.items():
            doc_ids.append(doc_id)
            logging.info(f"Upserting document_id: {doc_id}")

            for chunk in chunk_list:
                pinecone_metadata = self._get_pinecone_metadata(chunk.metadata)
                pinecone_metadata["text"] = chunk.text
                pinecone_metadata["document_id"] = doc_id

                vector = (chunk.id, chunk.embedding, pinecone_metadata)
                vectors.append(vector)

        batches = [
            vectors[i : i + UPSERT_BATCH_SIZE]
            for i in range(0, len(vectors), UPSERT_BATCH_SIZE)
        ]

        for batch in batches:
            try:
                logging.info(f"Upserting batch of size {len(batch)}")
                self.index.upsert(vectors=batch)
                logging.info(f"Upserted batch successfully")
            except Exception as e:
                logging.error(f"Error upserting batch: {e}")
                raise e

        return doc_ids

    @retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
    async def _query(
        self,
        queries: List[QueryWithEmbedding],
    ) -> List[QueryResult]:
        """Takes in a list of queries with embeddings and filters and returns a list of query results with matching document chunks and scores.

        Args:
            queries (List[QueryWithEmbedding]): A list of queries with embeddings and filters

        Returns:
            List[QueryResult]: A list of query results with matching document chunks and scores
        """

        async def _single_query(query: QueryWithEmbedding) -> QueryResult:
            logging.debug(f"Query: {query.query}")
            pinecone_filter = self._get_pinecone_filter(query.filter)

            try:
                query_response = self.index.query(
                    top_k=query.top_k,
                    vector=query.embedding,
                    filter=pinecone_filter,
                    include_metadata=True,
                )
            except Exception as e:
                logging.error(f"Error querying index: {e}")
                raise e

            query_results: List[DocumentChunkWithScore] = []

            for result in query_response.matches:
                score = result.score
                metadata = result.metadata

                metadata_without_text = None
                if metadata:
                    metadata_without_text = {}
                    for key, value in metadata.items():
                        if key != "text":
                            metadata_without_text[key] = value
                        if key == "created_at":
                            metadata_without_text[key] = str(value)

                if (
                    metadata_without_text
                    and "source" in metadata_without_text
                    and metadata_without_text["source"] not in Source.__members__
                ):
                    metadata_without_text["source"] = None

                result = DocumentChunkWithScore(
                    id=result.id,
                    score=score,
                    text=(
                        str(metadata["text"]) if metadata and "text" in metadata else ""
                    ),
                    metadata=metadata_without_text,
                )
                query_results.append(result)
            return QueryResult(query=query.query, results=query_results)

        # Run multiple _single_query coroutines concurrently
        results: List[QueryResult] = await asyncio.gather(*[_single_query(query) for query in queries])

        return results

    @retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
    async def delete(
        self,
        ids: Optional[List[str]] = None,
        filter: Optional[DocumentMetadataFilter] = None,
        delete_all: Optional[bool] = None,
    ) -> bool:
        """Removes vectors by ids, filter, or everything from the index.

        Args:
            ids (Optional[List[str]], optional): List of document ids to delete.
            filter (Optional[DocumentMetadataFilter], optional): Filter to delete vectors by metadata.
            delete_all (Optional[bool], optional): Flag to delete all vectors from the index.

        Raises:
            e: Any exception that occurs during the delete process

        Returns:
            bool: Whether the operation was successful
        """

        if delete_all:
            try:
                logging.info(f"Deleting all vectors from index")
                self.index.delete(delete_all=True)
                logging.info(f"Deleted all vectors successfully")
                return True
            except Exception as e:
                logging.error(f"Error deleting all vectors: {e}")
                raise e

        pinecone_filter = self._get_pinecone_filter(filter)

        if pinecone_filter != {}:
            try:
                logging.info(f"Deleting vectors with filter {pinecone_filter}")
                self.index.delete(filter=pinecone_filter)
                logging.info(f"Deleted vectors with filter successfully")
            except NotFoundException:
                logging.info(f"No vectors found with filter {pinecone_filter}")
            except Exception as e:
                logging.error(f"Error deleting vectors with filter: {e}")
                raise e

        if ids is not None and len(ids) > 0:
            try:
                logging.info(f"Deleting vectors with ids {ids}")
                pinecone_filter = {"document_id": {"$in": ids}}
                self.index.delete(filter=pinecone_filter)  # type: ignore
                logging.info(f"Deleted vectors with ids successfully")
            except Exception as e:
                logging.error(f"Error deleting vectors with ids: {e}")
                raise e

        return True

    def _get_pinecone_filter(
        self, filter: Optional[DocumentMetadataFilter] = None
    ) -> Dict[str, Any]:
        """Converts a DocumentMetadataFilter object to a Pinecone filter expression.

        Args:
            filter (Optional[DocumentMetadataFilter], optional): The filter to convert.

        Returns:
            Dict[str, Any]: The Pinecone filter expression
        """
        if filter is None:
            return {}

        pinecone_filter = {}

        for field, value in filter.model_dump().items():
            if value is not None:
                if field == "start_date":
                    pinecone_filter["created_at"] = pinecone_filter.get(
                        "created_at", {}
                    )
                    pinecone_filter["created_at"]["$gte"] = to_unix_timestamp(value)
                elif field == "end_date":
                    pinecone_filter["created_at"] = pinecone_filter.get(
                        "created_at", {}
                    )
                    pinecone_filter["created_at"]["$lte"] = to_unix_timestamp(value)
                else:
                    pinecone_filter[field] = value

        return pinecone_filter

    def _get_pinecone_metadata(
        self, metadata: Optional[DocumentChunkMetadata] = None
    ) -> Dict[str, Any]:
        """Converts a DocumentChunkMetadata object to a Pinecone metadata object.

        Args:
            metadata (Optional[DocumentChunkMetadata], optional): The metadata to convert.

        Returns:
            Dict[str, Any]: The Pinecone metadata object.
        """
        if metadata is None:
            return {}

        pinecone_metadata = {}

        for field, value in metadata.model_dump().items():
            if value is not None:
                if field in ["created_at"]:
                    pinecone_metadata[field] = to_unix_timestamp(value)
                else:
                    pinecone_metadata[field] = value

        return pinecone_metadata
