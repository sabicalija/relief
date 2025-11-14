#!/usr/bin/env node
/**
 * Download Depth Anything V2 Small model for self-hosting fallback
 */
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODEL_NAME = "depth-anything-v2-small";
const BASE_URL = `https://huggingface.co/onnx-community/${MODEL_NAME}/resolve/main`;
const OUTPUT_DIR = join(__dirname, "..", "public", "models", MODEL_NAME);

// Download all three model variants for user selection
// q8 (26MB) - CPU/WASM optimized
// fp16 (47MB) - GPU/WebGPU optimized
// fp32 (95MB) - Highest quality, works with both
const FILES = [
  "config.json",
  "preprocessor_config.json",
  "onnx/model_quantized.onnx", // q8 - 26MB
  "onnx/model_fp16.onnx", // fp16 - 47MB
  "onnx/model.onnx", // fp32 - 95MB
];

async function downloadFile(url, outputPath, name) {
  console.log(`Downloading ${name}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const buffer = await response.arrayBuffer();
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(buffer));

  const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
  console.log(`✓ ${name} (${sizeMB} MB)`);
}

async function main() {
  console.log("Downloading model files...\n");
  for (const file of FILES) {
    await downloadFile(`${BASE_URL}/${file}`, join(OUTPUT_DIR, file), file);
  }
  console.log(`\n✓ Done! Saved to: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("\n✗ Failed:", err.message);
  process.exit(1);
});
