from enum import Enum

class SupportedModels(str, Enum):
    gpt_4o = "gpt-4o"
    gpt_4 = "gpt-4"
    gpt_4_turbo = "gpt-4-turbo"
    gpt_3_5_turbo = "gpt-3.5-turbo"


class ErrorCodes(str, Enum):
    INVALID_REQUEST = "INVALID_REQUEST"



OPENAI_SEARCH_TOOL = [
    {
        "type": "function",
        "name": "search_vector_store",
        "description": "Search the vector store for information relevant to the query when course or client-related data is needed.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to retrieve relevant information from the vector store."
                }
            },
            "required": ["query"]
        }
    }
]

# Anthropic tool definition
ANTHROPIC_SEARCH_TOOL = [
    {
        "name": "search_vector_store",
        "description": "Search the vector store for information relevant to the query when course or client-related data is needed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to retrieve relevant information from the vector store."
                }
            },
            "required": ["query"]
        }
    }
]