from abc import ABC, abstractmethod
from typing import Union
from io import BytesIO

class BaseExtractor(ABC):
    @abstractmethod
    def extract_text(self, file: Union[BytesIO, str]) -> str:
        """
        Given either a file in memory (BytesIO) or a path string,
        return the extracted text from that file.
        """
        pass
