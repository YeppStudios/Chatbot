from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import asyncio

from chatbot.database.datastore.models.models import (
    Document,
    DocumentChunk,
    DocumentMetadataFilter,
    Query,
    QueryResult,
    QueryWithEmbedding,
)
from chatbot.database.datastore.services.chunks import get_document_chunks
from chatbot.services.openai_service import get_embeddings


class DataStore(ABC):
    async def upsert(
        self, documents: List[Document], chunk_token_size: Optional[int] = None
    ) -> List[str]:
        """
        Takes in a list of documents and inserts them into the database.
        First deletes all the existing vectors with the document id then inserts the new ones.
        Return a list of document ids.

        Args:
            documents (list): List of documents to upsert.
            chunk_token_size (int): The target size of each chunk in tokens.

        Returns:
            list: A list of upserted document ids.
        """
        # This is temporarily commented out because the delete method based on metadata is not supported in current Pinecone pricing tier.
        # await asyncio.gather(
        #     *[
        #         self.delete(
        #             filter=DocumentMetadataFilter(
        #                 document_id=document.id,
        #             ),
        #             delete_all=False,
        #         )
        #         for document in documents
        #         if document.id
        #     ]
        # )

        chunks = get_document_chunks(documents, chunk_token_size)

        return await self._upsert(chunks)

    @abstractmethod
    async def _upsert(self, chunks: Dict[str, List[DocumentChunk]]) -> List[str]:
        """
        Takes in a list of document chunks and inserts them into the database.
        Return a list of document ids.
        """

        raise NotImplementedError

    @abstractmethod
    async def _query(self, queries: List[QueryWithEmbedding]) -> List[QueryResult]:
        """
        Takes in a list of queries with embeddings and filters and returns a list of query results with matching document chunks and scores.
        """
        raise NotImplementedError

    @abstractmethod
    async def delete(
        self,
        ids: Optional[List[str]] = None,
        filter: Optional[DocumentMetadataFilter] = None,
        delete_all: Optional[bool] = None,
    ) -> bool:
        """
        Removes vectors by ids, filter, or everything in the datastore.
        Multiple parameters can be used at once.
        Returns whether the operation was successful.
        """
        raise NotImplementedError

    async def query(self, queries: List[Query]) -> List[QueryResult]:
        """
        Takes in a list of queries and filters and returns a list of query results with matching document chunks and scores.
        """
        query_texts = [query.query for query in queries]
        query_embeddings = get_embeddings(query_texts)

        queries_with_embeddings = [
            QueryWithEmbedding(**query.model_dump(), embedding=embedding)
            for query, embedding in zip(queries, query_embeddings)
        ]
        return await self._query(queries_with_embeddings)
