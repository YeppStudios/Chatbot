// utils/askLlmConversation.ts
import { backend } from "@/config/apiConfig";

interface VectorStoreConfig {
  store_type: string; // e.g., "pinecone", "weaviate"
  collection_name?: string; // Optional, e.g., "metrum"
  index_name?: string; // Optional
  namespace?: string; // Optional
  hybrid?: boolean; // Optional
  alpha?: number; // Optional
  fusion_type?: string; // Optional
  query_properties?: string[]; // Optional
  top_k?: number; // Optional
}

interface LLMConfig {
  provider: string; // e.g., "openai", "anthropic"
  model: string; // e.g., "gpt-4o", "claude-3.5-sonnet"
  temperature: number;
  max_tokens: number;
  system_message?: string;
}

export const askLlmConversation = async (
  query: string,
  conversationId: string,
  llmProvider: string,
  model: string,
  vectorStoreType: string,
  stream: boolean = false,
  token?: string
) => {
  const payload = {
    conversation_id: conversationId,
    query,
    vector_store: {
      store_type: vectorStoreType,
      index_name: "pdf-vectors", // Important: This is your Pinecone index name
      namespace: "pdf_files", // Empty string triggers search in BOTH default and pdf_files namespaces
      top_k: 5,
      hybrid: true
    } as VectorStoreConfig,
    llm: {
      provider: llmProvider,
      model,
      temperature: 0.25,
      max_tokens: 4096,
      system_message:
        "You are a helpful AI assistant that specializes in answering questions based on the content available in the provided documents and PDFs. By default you speak fluently in Polish, but when asked in different language you switch to user language. Sound natural and give direct answers. Never greet user. Rather ask followup questions. You reply only based on the facts you can find in retrieved content and nothing else. If you don't find relevant information in the retrieved content, please say so honestly."
    } as LLMConfig,
    stream,
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`; // Add JWT token if provided
    }

    const response = await fetch(`${backend.serverUrl}/ask-llm-conversation`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }

    if (stream) {
      if (response.body instanceof ReadableStream) {
        return response.body.getReader();
      } else {
        throw new Error("Expected a stream response but did not receive one.");
      }
    } else {
      const data = await response.json();
      return data.llm_response; // Return the LLM response string
    }
  } catch (error) {
    console.error("Failed to send to /ask-llm-conversation:", error);
    throw error;
  }
};