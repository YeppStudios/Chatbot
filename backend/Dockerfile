# Build stage
FROM python:3.12 as requirements-stage
WORKDIR /tmp 

# Install poetry with debug output
RUN pip install poetry && \
    echo "Poetry version:" && \
    poetry --version && \
    echo "Poetry installation location:" && \
    which poetry

# Copy dependency files
COPY ./pyproject.toml ./poetry.lock* /tmp/
RUN echo "Contents of /tmp:" && ls -la /tmp/

# First try to install urllib3 specifically
RUN pip install 'urllib3<2.0' && \
    echo "urllib3 version:" && \
    python -c "import urllib3; print(urllib3.__version__)"

# Install pytest dependencies first
RUN pip install pytest==8.3.4 pytest-asyncio==0.25.1 && \
    echo "Pytest version:" && \
    pytest --version

# Try to export requirements with debug info
RUN echo "Attempting to export requirements..." && \
    poetry config --list && \
    poetry export -f requirements.txt --output requirements.txt --without-hashes --verbose

# Final stage
FROM python:3.12
WORKDIR /code

# Copy requirements
COPY requirements.txt /code/requirements.txt


# Copy application code
COPY ./chatbot /code/chatbot

# Command to run the application
CMD ["uvicorn", "chatbot.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]