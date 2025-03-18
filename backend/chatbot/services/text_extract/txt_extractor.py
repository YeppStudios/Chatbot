from io import BytesIO
from .base import BaseExtractor

class TXTExtractor(BaseExtractor):
    def extract_text(self, file: BytesIO) -> str:
        # Assume ASCII/UTF-8
        return file.read().decode("utf-8", errors="ignore")
