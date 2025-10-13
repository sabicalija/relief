from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import io, hashlib, numpy as np, torch
from PIL import Image
import os, threading
MODEL_NAME = os.getenv("MODEL_NAME", "DPT_Hybrid")  # default lighter
_lock = threading.Lock()

app = FastAPI(
    title="Relief API",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

_device = "cuda" if torch.cuda.is_available() else "cpu"
_model = None
_transforms = None

def _load_model_once():
    global _model, _transforms
    if _model is None:
        with _lock:
            if _model is None:
                m = torch.hub.load("intel-isl/MiDaS", MODEL_NAME, pretrained=True)
                m.eval().to(_device)
                t = torch.hub.load("intel-isl/MiDaS", "transforms")
                _model = m
                _transforms = t.dpt_transform if "DPT" in MODEL_NAME else t.default_transform
    return _model, _transforms

@app.on_event("startup")
def _warm():
    # load once at startup so first /depth is fast and less error-prone
    _load_model_once()

@app.get("/", include_in_schema=False)
def root():
    return {"ok": True, "service": "relief"}

@app.get("/healthz", include_in_schema=True)
def healthz():
    return {"ok": True, "device": _device}

@app.get("/ping", include_in_schema=False)
def ping():
    return JSONResponse({"ok": True, "device": "cuda" if torch.cuda.is_available() else "cpu"})

@app.get("/readyz", include_in_schema=False)
def readyz():
    return {"ready": True}

@app.get("/livez", include_in_schema=False)
def livez():
    return {"live": True}

@app.post("/depth")
async def depth(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg","image/png","image/webp","image/bmp","image/tiff"}:
        raise HTTPException(415, "Unsupported image type")
    raw = await image.read()
    img = Image.open(io.BytesIO(raw)).convert("RGB")

    model, tfm = _load_model_once()
    arr = np.array(img)
    inp = tfm(arr)
    if inp.ndim == 3:
        inp = inp.unsqueeze(0)

    with torch.no_grad():
        pred = model(inp.to(_device)).squeeze().float().cpu().numpy()

    dmin, dmax = float(pred.min()), float(pred.max())
    norm = (pred - dmin) / max(1e-12, (dmax - dmin))
    png16 = (norm * 65535.0).round().astype(np.uint16)

    pil_depth = Image.fromarray(png16, mode="I;16")
    buf = io.BytesIO()
    pil_depth.save(buf, format="PNG")
    buf.seek(0)

    meta = {
        "width": int(png16.shape[1]),
        "height": int(png16.shape[0]),
        "depth_min": dmin,
        "depth_max": dmax,
        "normalized": True,
        "model": "midas-dpt-large-512",
        "image_sha256": hashlib.sha256(raw).hexdigest(),
    }
    headers = {"X-Depth-Meta": JSONResponse(content=meta).body.decode("utf-8")}
    return StreamingResponse(buf, media_type="image/png", headers=headers)
