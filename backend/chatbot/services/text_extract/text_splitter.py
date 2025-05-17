import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import nltk
nltk.download('punkt')  # Make sure we're downloading the correct tokenizer data

import tiktoken
from nltk.tokenize import sent_tokenize
from typing import List

def text_splitter(
    text: str,
    model_name: str = "text-embedding-3-large",
    target_chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[str]:
    tokenizer = tiktoken.encoding_for_model(model_name)
    sentences = sent_tokenize(text)

    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence_length = len(tokenizer.encode(sentence))

        if current_length + sentence_length > target_chunk_size:
            chunks.append(" ".join(current_chunk).strip())
            
            overlap_sentences = []
            overlap_length = 0
            for prev_sentence in reversed(current_chunk):
                prev_sentence_length = len(tokenizer.encode(prev_sentence))
                if overlap_length + prev_sentence_length > chunk_overlap:
                    break
                overlap_sentences.insert(0, prev_sentence)
                overlap_length += prev_sentence_length

            current_chunk = overlap_sentences
            current_length = overlap_length

        current_chunk.append(sentence)
        current_length += sentence_length

    if current_chunk:
        chunks.append(" ".join(current_chunk).strip())

    return chunks