# Self-Hosted Depth Anything V2 Model

This directory contains a self-hosted copy of the Depth Anything V2 Small model as a fallback for when Hugging Face CDN is unavailable.

## Model Info

- **Source**: https://huggingface.co/onnx-community/depth-anything-v2-small
- **Size**: ~26MB (quantized q8 model)
- **License**: Apache 2.0
- **Purpose**: Fallback for Transformers.js depth estimation

## Quick Setup

From the web app directory, run:

```bash
pnpm download:models
```

This downloads all necessary model files to `public/models/depth-anything-v2-small/`.

## Detailed Instructions

### Option 1: Download Script (Recommended)

Run the download script:

```bash
cd apps/web
pnpm download:models
# or: node scripts/download-depth-model.js
```

This will download all necessary model files (~26MB) to `public/models/depth-anything-v2-small/`.

### Option 2: Manual Download

1. Visit: https://huggingface.co/onnx-community/depth-anything-v2-small/tree/main

2. Download these files to `public/models/depth-anything-v2-small/`:
   - `config.json`
   - `onnx/model_quantized.onnx` (~26MB, q8 quantized)
   - `preprocessor_config.json`

3. Verify the directory structure:
   ```
   public/models/depth-anything-v2-small/
   ├── config.json
   ├── onnx/
   │   └── model_quantized.onnx
   └── preprocessor_config.json
   ```

## Fallback Behavior

The app automatically handles fallbacks:

1. **Primary**: Tries Hugging Face CDN (`onnx-community/depth-anything-v2-small`)
2. **Fallback**: If HF fails, tries self-hosted (`/models/depth-anything-v2-small`)

Users only download from one source - whichever succeeds first. The browser caches the model after first download.

## Git & Deployment

The `.onnx` files are gitignored due to size (25MB). Options:

**For local development:**
- Run `pnpm download:models` after cloning

**For GitHub Pages deployment:**
- Either commit the models (not recommended, increases repo size)
- Or use GitHub Actions to download during build (recommended)

**Example GitHub Actions step:**
```yaml
- name: Download ML models
  run: |
    cd apps/web
    pnpm download:models
```

## Should You Self-Host?

**You're already covered!** The app works fine using Hugging Face CDN. Self-hosting is optional:

- ✅ **Use self-hosted for**: Reliability, offline demos, enterprise deployments
- ✅ **Skip self-hosted if**: Hobby project, trust HF CDN (99.9%+ uptime)

The 25MB is negligible for GitHub Pages (1GB repo limit, 100MB file limit per file).

