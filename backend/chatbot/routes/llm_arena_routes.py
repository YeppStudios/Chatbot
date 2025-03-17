from chatbot.routes.ai_response_routes import LLMConfig, SearchResult, VectorStoreConfig
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
import os
import logging
import pandas as pd
import time
from dotenv import load_dotenv
from openai import OpenAI
import anthropic

# Set up logging - console only
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("llm_search")

load_dotenv()

router = APIRouter()


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
            search_results = await perform_vector_search(query, request.vector_store)

            # 2. Prepare context (if you plan to feed it to the LLMs)
            context = prepare_context(search_results)

            # 3. For each LLM, generate a response
            llm_responses = []
            for llm_config in request.llms:
                llm_response, llm_provider, llm_model = await generate_llm_response(
                    query=query,
                    context=context,
                    llm_config=llm_config,
                    request_id=f"{request_id}_{idx}"
                )
                llm_responses.append(
                    ComparisonLLMResponse(
                        provider=llm_provider,
                        model=llm_model,
                        response=llm_response
                    )
                )

            # 4. Append the overall result for this query
            comparison_results.append(
                ComparisonQueryResult(
                    query=query,
                    vector_search_results=[
                        SearchResult(text=res["text"], score=res["score"])
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
