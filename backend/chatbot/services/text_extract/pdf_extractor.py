# Update in backend/chatbot/services/text_extract/pdf_extractor.py
# Make sure the OCR logic is working well

import os
import io
import logging
from typing import Optional, BinaryIO, Union

import pytesseract
from pdf2image import convert_from_bytes
from pypdf import PdfReader

from .base import BaseExtractor

class PDFExtractor(BaseExtractor):
    """Extract text from PDF files, with OCR capability for images/scanned documents."""

    def __init__(self, logger: Optional[logging.Logger] = None, text_threshold: int = 50):
        self.logger = logger or logging.getLogger(__name__)
        self.text_threshold = text_threshold  # Minimum character count to consider embedded text sufficient

    def extract_text(self, file: Union[BinaryIO, io.BytesIO]) -> str:
        """Extract text from a PDF file, using OCR if necessary."""
        pdf_bytes = file.read() if hasattr(file, 'read') else file
        if isinstance(pdf_bytes, str):
            # If it's a file path
            with open(pdf_bytes, 'rb') as f:
                pdf_bytes = f.read()

        # 1) Try extracting embedded text using pypdf
        embedded_text = self._extract_embedded_text(pdf_bytes)

        # Check if embedded text is sufficient (at least text_threshold characters)
        if len(embedded_text.strip()) > self.text_threshold:
            self.logger.info("Sufficient embedded text found; returning extracted text.")
            return embedded_text
        else:
            # 2) If insufficient text found, run OCR
            self.logger.info("Minimal embedded text found; attempting OCR...")
            ocr_text = self._run_ocr(pdf_bytes)
            
            # If OCR also found very little text, try combining results
            if len(ocr_text.strip()) < self.text_threshold:
                combined_text = f"{embedded_text}\n\n{ocr_text}"
                self.logger.info(f"Combined text length: {len(combined_text)}")
                return combined_text.strip()
                
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

        for i, img in enumerate(images):
            try:
                self.logger.info(f"Running OCR on page {i+1}")
                text = pytesseract.image_to_string(img)
                extracted.append(text)
            except Exception as e:
                self.logger.error(f"Error during Tesseract OCR: {str(e)}")

        return "\n".join(extracted)