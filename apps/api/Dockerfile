FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-fetch MiDaS weights to reduce cold-starts
RUN python - <<'PY'
import torch
torch.hub.load("intel-isl/MiDaS", "DPT_Large", pretrained=True)
torch.hub.load("intel-isl/MiDaS", "transforms")
PY

COPY app.py .
ENV PORT=8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
