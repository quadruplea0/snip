import type {
  DeviceInfo,
  GpuLike,
  WorkerMessage,
} from "./infer-protocol";
import { requestAdapterWithRetry } from "./infer-protocol";

export type { DeviceInfo };

type Pending = {
  resolve: (value: { blob: Blob; tier: string }) => void;
  reject: (reason: Error) => void;
  onProgress?: (label: string) => void;
};

let devicePromise: Promise<DeviceInfo> | null = null;
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

export function detectDevice(): Promise<DeviceInfo> {
  devicePromise ??= detect();
  return devicePromise;
}

async function detect(): Promise<DeviceInfo> {
  const gpu = (navigator as Navigator & { gpu?: GpuLike }).gpu;
  if (!gpu) {
    return { tier: "wasm", label: "no webgpu · wasm fallback, slower" };
  }
  try {
    // Chrome on Linux can return a null adapter for a few seconds after
    // launch (Vulkan still coming up), so retry before giving up.
    const adapter = await requestAdapterWithRetry(gpu);
    if (!adapter) {
      return { tier: "wasm", label: "no webgpu adapter · wasm fallback" };
    }
    const info = adapter.info;
    const name =
      info?.description ??
      [info?.vendor, info?.architecture].filter(Boolean).join(" ") ??
      "";
    if (!adapter.features.has("shader-f16")) {
      return {
        tier: "wasm",
        label: name
          ? `no fp16 on ${name} · wasm fallback`
          : "no webgpu fp16 · wasm fallback",
      };
    }
    return { tier: "webgpu", label: `webgpu · ${name} · fp16` };
  } catch {
    return { tier: "wasm", label: "webgpu unavailable · wasm fallback" };
  }
}

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("../workers/infer.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    const entry = pending.get(message.id);
    if (!entry) return;
    if (message.type === "progress") {
      entry.onProgress?.(message.label);
      return;
    }
    pending.delete(message.id);
    if (message.type === "done") {
      entry.resolve({ blob: message.blob, tier: message.tier });
    } else {
      entry.reject(new Error(message.message));
    }
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || "inference worker failed");
    for (const [, entry] of pending) entry.reject(error);
    pending.clear();
  };
  return worker;
}

export async function removeBackground(
  file: File,
  onProgress?: (label: string) => void,
  model = "rmbg-1.4",
): Promise<{ blob: Blob; tier: string }> {
  const id = ++nextId;
  const instance = ensureWorker();
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    instance.postMessage({ id, file, model });
  });
}
