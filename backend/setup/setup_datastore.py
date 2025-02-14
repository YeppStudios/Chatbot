from typing import List
from dotenv import load_dotenv
import asyncio
from datetime import datetime
import pathlib
import path
import sys
import os 

directory = path.Path(__file__).abspath()
sys.path.append(directory.parent.parent)

from avatar.database.datastore.models.models import Document, Query
from avatar.database.datastore.pinecone_datastore import PineconeDataStore
from avatar.database.datastore.services.helpers import create_uuid_from_string

import logging

load_dotenv()
logging.basicConfig(level=logging.DEBUG)

ROOT_PATH = pathlib.Path(
    __file__
).parent.parent.parent.absolute()  # Path to the root of the project


async def import_files_from_folder(folder_path: str):
    """Imports all files from a folder into the Pinecone database

    Args:
        folder_path (str): The path to the folder with files to import
    """
    datastore = PineconeDataStore()

    for document in _get_documents_from_folder_files(folder_path):
        await datastore.upsert([document])
        logging.info(
            f"Document with id:{document.id} based on file:{document.metadata.source_id} has been upserted"
        )


async def import_single_file(file_path: str):
    """Imports a single file into the Pinecone database

    Args:
        file_path (str): The path to the file to import
    """
    datastore = PineconeDataStore()
    document = _get_document_from_single_file(file_path)

    await datastore.upsert([document])
    logging.info(
        f"Document with id:{document.id} based on file:{document.metadata.source_id} has been upserted"
    )


async def delete_all_vectors_from_index(filter=None):
    """Deletes all vectors from the Pinecone index"""
    datastore = PineconeDataStore()
    if filter:
        await datastore.delete(filter=filter)
        logging.info("All vectors have been deleted from the index")
    else:
        await datastore.delete(delete_all=True)
    logging.info("All vectors have been deleted from the index")


def get_raw_data(file_path: str) -> str:
    """_summary_

    Args:
        file_path (str): Path to the file

    Returns:
        str: Raw data from the file
    """
    with open(file_path, "r") as file:
        return str(file.read())


def _get_documents_from_folder_files(folder_path):
    """Create a document object for each file in the folder

    Args:
        file_path (str): Path to the folder with files

    Yields:
        object: Document object
    """
    path = pathlib.Path(folder_path)

    for file_path in path.iterdir():
        yield _get_document_from_single_file(file_path)


def _get_document_from_single_file(file_path: str):
    """Create a document object from a single file

    Args:
        file_path (str): Path to the file

    Returns:
        _type_: Document object
    """
    file_path = pathlib.Path(file_path)
    file_content = get_raw_data(file_path)
    file_name = file_path.stem.replace(" ", "_")

    return Document(
        id=create_uuid_from_string(file_name),
        text=file_content,
        metadata={
            "source": "file",
            "source_id": file_name,
            "created_at": datetime.now().isoformat(),
        },
    )

async def get_query_result(question: str, top_k: int = 3):
    """Returns the top k results from database for a given question

    Args:
        question (str): Question to ask
        top_k (int, optional): Number of results to return. Defaults to 3.

    Returns:
        List[DocumentChunkWithScore]: List of DocumentChunkWithScore objects
    """
    datastore = PineconeDataStore()
    query = Query(query=question, top_k=top_k)
    results = await datastore.query([query])
    
    return results[0].results


## SAMPLE QUERY ##

# sample_query = "Z jakiego betonu zaprojektowano słupy budynku?"
# asyncio.run(get_query_result(sample_query, 3))

## SAMPLE IMPORT FROM FOLDER ##

# asyncio.run(import_files_from_folder(f"{ROOT_PATH}/backend/setup/data/extracted"))

## SAMPLE IMPORT FROM FILE ##

# asyncio.run(
#     import_single_file(f"{ROOT_PATH}/backend/setup/data/extracted/OPIS_BUDYNKU_extracted.txt")
# )

## SAMPLE DELETE ALL VECTORS ##

# asyncio.run(delete_all_vectors_from_index())


async def main():
    await import_single_file(
        f"{ROOT_PATH}/backend/setup/data/extracted/OPIS_BUDYNKU_gptv_extracted.txt"
    )


if __name__ == "__main__":
    asyncio.run(main())
