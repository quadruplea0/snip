import { AutoConfig, RawImage, env, pipeline } from "@huggingface/transformers";

import type { GpuLike, RunRequest, WorkerMessage } from "../lib/infer-protocol";
import { requestAdapterWithRetry } from "../lib/infer-protocol";

env.allowLocalModels = false;

// Repo configs ship a model_type transformers.js cannot resolve (class name
// or backbone name), so each spec carries the registered type to patch in.
type ModelSpec = {
  repoId: string;
  modelType: string;
  wasmDtype: "q8" | "fp16";
  /** Custom remote host (r2.dev) — overrides env.remoteHost. */
  remoteHost?: string;
};

const MODELS: Record<string, ModelSpec> = {
  "rmbg-1.4": {
    repoId: "briaai/RMBG-1.4",
    modelType: "segformer",
    wasmDtype: "q8",
  },
  // Upstream BiRefNet ONNX has Split/GatherND ops ORT's WebGPU EP cannot
  // compile (invalid Pad/Split shaders). Wattsey's 512 rewrite (same patch
  // lineage as jiabins0303's 1024) is bit-identical on CPU and runs on
  // WebGPU within tighter buffer limits. We further rewrote all 34 Pad
  // ops to Concat+zeros so the WebGPU Pad shader bug is avoided entirely.
  "birefnet-lite": {
    repoId: "birefnet-lite",
    modelType: "birefnet",
    wasmDtype: "fp16",
    remoteHost: "https://pub-25be6ce4ed2041fbbb2bdd43f479b2e8.r2.dev",
  },
};

type LoadAttempt = {
  dtype: "fp16" | "q8";
  device: "webgpu" | "wasm";
  label: string;
};

type Remover = (image: unknown) => Promise<RawImage>;

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<RunRequest>) => void) | null;
  postMessage(message: WorkerMessage): void;
};

const removers = new Map<string, { run: Remover; tier: string }>();
const webgpuBroken = new Set<string>();
let activeId = 0;

function post(message: WorkerMessage) {
  workerScope.postMessage(message);
}

function fileName(path: string) {
  return path.split("/").pop() ?? path;
}

function onProgress(update: {
  status?: string;
  file?: string;
  progress?: number;
}) {
  if (update.status === "progress" && update.file) {
    const percent = Math.round(update.progress ?? 0);
    post({
      id: activeId,
      type: "progress",
      label: `downloading ${fileName(update.file)} ${percent}%`,
    });
  } else if (update.status === "done" && update.file) {
    post({
      id: activeId,
      type: "progress",
      label: `loaded ${fileName(update.file)}`,
    });
  } else if (update.status === "ready") {
    post({ id: activeId, type: "progress", label: "session ready" });
  }
}

async function candidateAttempts(
  wasmDtype: LoadAttempt["dtype"],
  modelId: string,
): Promise<LoadAttempt[]> {
  const attempts: LoadAttempt[] = [];
  const gpu = (navigator as Navigator & { gpu?: GpuLike }).gpu;
  if (gpu && !webgpuBroken.has(modelId)) {
    try {
      const adapter = await requestAdapterWithRetry(gpu);
      if (adapter?.features.has("shader-f16")) {
        attempts.push({ dtype: "fp16", device: "webgpu", label: "fp16 · webgpu" });
      }
    } catch {
      /* no adapter, wasm only */
    }
  }
  attempts.push({ dtype: wasmDtype, device: "wasm", label: `${wasmDtype} · wasm` });
  return attempts;
}

async function loadRemover(modelId: string): Promise<{ run: Remover; tier: string }> {
  const cached = removers.get(modelId);
  if (cached) return cached;

  const spec = MODELS[modelId];
  if (!spec) throw new Error(`unknown model: ${modelId}`);

  // For locally-hosted models, point transformers.js at the r2.dev URL.
  const prevRemoteHost = env.remoteHost;
  if (spec.remoteHost) {
    env.remoteHost = spec.remoteHost;
  }

  try {
    const config = await AutoConfig.from_pretrained(spec.repoId);
    (config as { model_type: string }).model_type = spec.modelType;

    let lastError: unknown = new Error("no runnable backend");
    for (const attempt of await candidateAttempts(spec.wasmDtype, modelId)) {
      try {
        post({ id: activeId, type: "progress", label: `loading ${attempt.label}` });
        const loaded = await pipeline("background-removal", spec.repoId, {
          config,
          dtype: attempt.dtype,
          device: attempt.device,
          progress_callback: onProgress,
        });
        const entry = { run: loaded as unknown as Remover, tier: attempt.label };
        removers.set(modelId, entry);
        return entry;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  } finally {
    env.remoteHost = prevRemoteHost;
  }
}

async function toPng(image: RawImage): Promise<Blob> {
  const rgba = image.channels === 4 ? image : image.rgba();
  const data = new Uint8ClampedArray(
    rgba.data as unknown as ArrayLike<number>,
  );
  const canvas = new OffscreenCanvas(rgba.width, rgba.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2d context");
  context.putImageData(new ImageData(data, rgba.width, rgba.height), 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/out of memory|allocat/i.test(message)) {
    return "out of memory, try a smaller image";
  }
  if (/fetch|network|cors/i.test(message)) {
    return `could not download the model (${message})`;
  }
  return message;
}

function isWebgpuError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /webgpu|wgpu|shader|compute pipeline|kernel/i.test(message);
}

async function runOnce(
  modelId: string,
  file: Blob,
): Promise<{ blob: Blob; tier: string }> {
  const { run, tier } = await loadRemover(modelId);
  post({ id: activeId, type: "progress", label: "running inference" });
  const image = await RawImage.read(file);
  const output = await run(image);
  return { blob: await toPng(output), tier };
}

workerScope.onmessage = async (event) => {
  const { id, file, model } = event.data;
  activeId = id;
  try {
    let result;
    try {
      result = await runOnce(model, file);
    } catch (error) {
      // WebGPU kernels can fail at run time (e.g. a shader that does not
      // compile on this adapter). Evict the session, mark the device
      // broken for this model, and retry once on wasm.
      const cached = removers.get(model);
      if (!cached || !cached.tier.includes("webgpu") || !isWebgpuError(error)) {
        throw error;
      }
      removers.delete(model);
      webgpuBroken.add(model);
      post({
        id,
        type: "progress",
        label: "webgpu failed, retrying on cpu",
      });
      result = await runOnce(model, file);
    }
    post({ id, type: "done", blob: result.blob, tier: result.tier });
  } catch (error) {
    post({ id, type: "error", message: describe(error) });
  }
};
