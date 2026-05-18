FROM python:3.11-slim

# System deps for OpenCV and MediaPipe (libgl1 replaces obsolete libgl1-mesa-glx on Debian 12+)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download YOLOv8 weights at build time (avoids cold-start download)
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n-seg.pt')" || true

COPY . .

# Create artifact directories
RUN mkdir -p artifacts/models artifacts/feature_cache

ENV PYTHONUNBUFFERED=1
ENV MODEL_DIR=/app/artifacts/models
ENV ALLOWED_ORIGINS=*

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "2", "--timeout-keep-alive", "75"]
