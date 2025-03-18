from abc import ABC, abstractmethod
from typing import List

class BaseLLM(ABC):

    @abstractmethod
    async def generate_response(self, query: str, context: List[str], history: List[str]) -> str:
        pass
