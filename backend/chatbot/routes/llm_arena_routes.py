from chatbot.services.retrieval.vector_search import VectorSearchService
from chatbot.routes.ai_response_routes import LLMConfig, SearchResult, VectorStoreConfig
from chatbot.services.llm.anthropic import AnthropicLLM
from chatbot.services.llm.openai import OpenAILLM
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
import os
import logging
import pandas as pd
import time
from dotenv import load_dotenv

# Set up logging - console only
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("llm_search")

load_dotenv()

router = APIRouter()

vector_search_service = VectorSearchService()

class ComparisonLLMResponse(BaseModel):
    provider: str
    model: str
    response: str

class ComparisonQueryResult(BaseModel):
    query: str
    vector_search_results: List[SearchResult]
    llm_responses: List[ComparisonLLMResponse]

class MultiLLMComparisonRequest(BaseModel):
    queries: List[str]
    vector_store: VectorStoreConfig
    llms: List[LLMConfig]

class MultiLLMComparisonResponse(BaseModel):
    comparisons: List[ComparisonQueryResult]

@router.post("/compare-llms", response_model=MultiLLMComparisonResponse)
async def compare_llms(request: MultiLLMComparisonRequest):
    request_id = f"cmp_{int(time.time())}"
    logger.info(f"[{request_id}] Starting LLM comparison")

    comparison_results = []

    for idx, query in enumerate(request.queries):
        try:
            # 1. Perform vector search (once per query)
            search_results = await vector_search_service.perform_vector_search(query, request.vector_store)

            # 2. Prepare context
            context = vector_search_service.prepare_context(search_results)

            # 3. For each LLM, generate a response
            llm_responses = []
            for llm_config in request.llms:
                # Prepare messages with context in the user message, not system message
                messages = [
                    {"role": "user", "content": f"Context:\n{context}\n\nQuery:\n{query}"}
                ]
                
                # Instantiate the appropriate LLM service
                llm = (OpenAILLM if llm_config.provider == "openai" else AnthropicLLM)(
                    model=llm_config.model,
                    stream=False,  # No streaming for comparison
                    temperature=llm_config.temperature,
                    max_tokens=llm_config.max_tokens,
                    instructions=llm_config.system_message  # System message as instructions
                )
                
                # Generate response
                response = await llm.generate_response(messages)
                llm_response = response if isinstance(response, str) else ""
                
                llm_responses.append(
                    ComparisonLLMResponse(
                        provider=llm_config.provider,
                        model=llm_config.model,
                        response=llm_response
                    )
                )

            # 4. Append the overall result for this query
            comparison_results.append(
                ComparisonQueryResult(
                    query=query,
                    vector_search_results=[
                        SearchResult(text=res["text"], score=res["score"], filename=res["filename"])
                        for res in search_results
                    ],
                    llm_responses=llm_responses
                )
            )

        except Exception as e:
            logger.error(
                f"[{request_id}] Error while processing query '{query}': {str(e)}",
                exc_info=True
            )
            raise HTTPException(status_code=500, detail=str(e))

    # ----------------------------------------------------------------------
    # Build and save a CSV table with queries vs. [provider-model] columns
    # ----------------------------------------------------------------------
    # Prepare rows for DataFrame
    data_rows = []
    for comp_result in comparison_results:
        row_data = {"query": comp_result.query}
        for llm_resp in comp_result.llm_responses:
            # Create a column name like "openai-gpt-4" or "anthropic-claude-v1"
            column_name = f"{llm_resp.provider}-{llm_resp.model}"
            row_data[column_name] = llm_resp.response
        
        data_rows.append(row_data)

    # Convert to DataFrame
    df = pd.DataFrame(data_rows)

    # ---------------------------------------------------------------
    # Generate CSV filename with store_type, top_k, and hybrid flag
    # ---------------------------------------------------------------
    store_type = request.vector_store.store_type
    top_k = request.vector_store.top_k
    hybrid = request.vector_store.hybrid

    # Base filename parts
    filename_parts = [
        "llm_comp",
        f"{store_type}_top{top_k}"
    ]

    # Conditionally add "hybrid" if true
    if hybrid:
        filename_parts.append("hybrid")

    # Join and append .csv
    csv_filename = "_".join(filename_parts) + ".csv"
    
    # Save to a CSV file
    df.to_csv(csv_filename, index=False, encoding='utf-8')
    logger.info(f"[{request_id}] Comparison results saved to {csv_filename}")

    logger.info(f"[{request_id}] Comparison complete.")
    return MultiLLMComparisonResponse(comparisons=comparison_results)