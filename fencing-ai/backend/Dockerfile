FROM python:3.11-slim

WORKDIR /app

# System libraries required by mediapipe and opencv-headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libgl1 \
    gcc \
    g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install production deps (torch excluded — training only, not needed at runtime)
COPY requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt

COPY . .

# Runtime directories (ephemeral on Railway — fine for MVP)
RUN mkdir -p uploads downloads frames dataset/data

EXPOSE 8000

# Railway injects $PORT; fall back to 8000 for local docker runs
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
