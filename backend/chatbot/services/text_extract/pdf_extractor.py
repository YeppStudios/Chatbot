# pdf_extractor.py

import base64
import io
import logging
from pathlib import Path
from typing import Optional

import pytesseract
from pdf2image import convert_from_bytes
from pypdf import PdfReader

from .base import BaseExtractor  # or from .base import BaseFileExtractor; adapt to your naming

class PDFExtractor(BaseExtractor):

    def __init__(self, logger: Optional[logging.Logger] = None, text_threshold: int = 50):
        self.logger = logger or logging.getLogger(__name__)
        self.text_threshold = text_threshold

    def extract_text(self, file: io.BytesIO) -> str:
        pdf_bytes = file.read()
        
        # 1) Extract embedded text using pypdf
        extracted_text = self._extract_embedded_text(pdf_bytes)

        if len(extracted_text.strip()) > self.text_threshold:
            # Sufficient embedded text found -> pass-through (base64-encoded raw PDF).
            self.logger.info("Sufficient embedded text found; returning pass-through PDF data.")
            b64_data = base64.b64encode(pdf_bytes).decode("utf-8")
            return b64_data
        else:
            # 2) Otherwise, do OCR
            self.logger.info("Minimal embedded text found; attempting OCR...")
            ocr_text = self._run_ocr(pdf_bytes)
            return ocr_text

    def _extract_embedded_text(self, pdf_bytes: bytes) -> str:
        """Extract embedded text from the PDF using pypdf (no OCR)."""
        text_buffer = []
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text_buffer.append(page_text)
        except Exception as e:
            self.logger.error(f"Error reading PDF with PdfReader: {str(e)}")
            return ""
        return "\n".join(text_buffer)

    def _run_ocr(self, pdf_bytes: bytes) -> str:
        """Convert PDF pages to images and run Tesseract OCR on each page."""
        extracted = []
        try:
            # You can adjust DPI to balance speed vs. accuracy
            images = convert_from_bytes(pdf_bytes, dpi=150)
        except Exception as e:
            self.logger.error(f"Error converting PDF to images for OCR: {str(e)}")
            return ""

        for img in images:
            try:
                text = pytesseract.image_to_string(img)
                extracted.append(text)
            except Exception as e:
                self.logger.error(f"Error during Tesseract OCR: {str(e)}")

        return "\n".join(extracted)
