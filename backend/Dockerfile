# Build stage
FROM python:3.12-slim AS requirements-stage
WORKDIR /tmp

# Install Poetry
RUN pip install poetry && \
    poetry --version

# Copy dependency files
COPY ./pyproject.toml ./poetry.lock* /tmp/

# Export requirements from Poetry to requirements.txt
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --verbose || { echo "Poetry export failed"; exit 1; }

# Final stage
FROM python:3.12-slim
WORKDIR /code

# Install system dependencies (if needed for your app, e.g., for pdf2image or pytesseract)
RUN apt-get update && apt-get install -y \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements.txt from the requirements-stage
COPY --from=requirements-stage /tmp/requirements.txt /code/requirements.txt

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip setuptools && \
    pip install --no-cache-dir -r /code/requirements.txt

# Copy application code
COPY ./chatbot /code/chatbot

# Command to run the application
CMD ["uvicorn", "chatbot.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]