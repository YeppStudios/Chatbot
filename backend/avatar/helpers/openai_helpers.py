from openai import OpenAI
import openai
import os
from typing import List
from pydantic import BaseModel
from pinecone import Pinecone

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
scripted_index = pc.Index("responsescripts")

openai = OpenAI()

async def check_scripted_response(question: str, avatar_id: str) -> tuple[bool, str]:
    try:
        # Generate embedding for the question
        response = openai.embeddings.create(
            input=question,
            model="text-embedding-3-large"
        )
        query_embedding = response.data[0].embedding

        search_response = scripted_index.query(
            namespace=avatar_id, 
            vector=query_embedding,
            top_k=1,
            include_metadata=True,
            score_threshold=0.85
        )

        if search_response.get('matches') and search_response['matches'][0]['score'] >= 0.85:
            metadata = search_response['matches'][0]['metadata']
            return True, metadata.get('response', '')
        
        return False, ''

    except Exception as e:
        print(f"Error checking scripted response: {e}")
        return False, ''



class ConversationAnalysis(BaseModel):
    conversation_summary: str
    greeting_message: str

async def analyze_conversations(
    thread_messages: List,
    conversation_count: int,
    user_language: str,
    openai: OpenAI,
    summary_rules: str = None,
    welcome_rules: str = None
) -> ConversationAnalysis:
    """
    Analyzes previous conversations and generates a summary and greeting message using custom rules.
    """
    base_context = f"""
    Based on the following context:
    - User's language: {user_language}
    - Number of previous conversations: {conversation_count} (say something personalized based on that, like it seems you relly liked x etc.)
    - Previous conversation history: {str(thread_messages) if thread_messages else 'No messages found'}
    """

    if summary_rules or welcome_rules:
        generation_instructions = f"""
        Generate:
        1. A conversation summary following these rules:
        {summary_rules or "Provide a general summary of the conversation history."}

        2. A welcome message following these rules:
        {welcome_rules or f"Create a welcoming message in {user_language} appropriate for the user's visit count."}
        """
    else:
        # Fallback to default rules
        generation_instructions = f"""
        Generate:
        1. A general summary of previous conversations that notes key interactions and preferences.
        2. A personalized greeting message in {user_language} that's appropriate for the user's visit count.
        """

    try:
        completion = openai.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": base_context + generation_instructions + f"""Make sure the conversation summary and greeting message are in {user_language}."""},
            ],
            response_format=ConversationAnalysis,
        )
        return completion.choices[0].message.parsed
    except Exception as e:
        print(f"Error generating analysis: {e}")
        return ConversationAnalysis(
            conversation_summary=None,
            greeting_message="Welcome!" if user_language == "English" else "¡Bienvenido!"
        )

async def fetch_thread_messages(thread_id: str) -> List:
    try:
        messages = []
        thread_messages = openai.beta.threads.messages.list(thread_id=thread_id)
        for msg in thread_messages.data:
            messages.append({
                "role": msg.role,
                "content": msg.content[0].text.value if msg.content else "",
                "created_at": msg.created_at
            })
        return messages
    except Exception as e:
        print(f"Error fetching messages for thread {thread_id}: {e}")
        return []
    

