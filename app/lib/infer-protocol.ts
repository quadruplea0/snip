export type DeviceInfo = {
  tier: "webgpu" | "wasm";
  label: string;
};

export type RunRequest = {
  id: number;
  file: Blob;
  model: string;
};

export type WorkerMessage =
  | { id: number; type: "progress"; label: string }
  | { id: number; type: "done"; blob: Blob; tier: string }
  | { id: number; type: "error"; message: string };

export type GpuAdapterLike = {
  features: { has(feature: string): boolean };
  info?: {
    vendor?: string;
    architecture?: string;
    description?: string;
  };
};

export type GpuLike = {
  requestAdapter(): Promise<GpuAdapterLike | null>;
};

// Chrome on Linux can return a null adapter for several seconds after
// launch while Vulkan comes up. Retry with a bounded backoff before
// concluding WebGPU is unavailable.
export async function requestAdapterWithRetry(
  gpu: GpuLike,
  tries = 12,
  delayMs = 500,
): Promise<GpuAdapterLike | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const adapter = await gpu.requestAdapter();
      if (adapter) return adapter;
    } catch {
      /* transient failure, retry */
    }
    if (attempt < tries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}
