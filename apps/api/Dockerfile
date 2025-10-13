FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    git libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -r requirements.txt

# Cache hub/weights into the image layers
ENV TORCH_HOME=/root/.cache/torch
RUN python - <<'PY'
import torch, os
model = os.getenv("MODEL_NAME","DPT_Hybrid")
torch.hub.load("intel-isl/MiDaS", model, pretrained=True)
_ = torch.hub.load("intel-isl/MiDaS", "transforms")
print("Prefetched", model, "and transforms")
PY

COPY app.py .
ENV PORT=8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers", "--forwarded-allow-ips", "*"]
