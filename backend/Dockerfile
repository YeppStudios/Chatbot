# Build stage
FROM python:3.12 as requirements-stage
WORKDIR /tmp

# Install a known Poetry version >= 1.2
RUN pip install --upgrade "poetry>=1.2.0"
RUN poetry --version

# Copy dependency files
COPY ./pyproject.toml ./poetry.lock* /tmp/

# (Optional) Show what's there, for debugging
RUN ls -la /tmp/

# Export requirements
RUN poetry export --without-hashes -f requirements.txt -o requirements.txt

# Final stage
FROM python:3.12
WORKDIR /code

# Copy requirements from build stage
COPY --from=requirements-stage /tmp/requirements.txt /code/requirements.txt

# Install dependencies (including uvicorn if it’s in pyproject.toml)
RUN pip install --no-cache-dir -r requirements.txt

# Copy your code
COPY ./chatbot /code/chatbot

# Run FastAPI with uvicorn
CMD ["uvicorn", "chatbot.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
