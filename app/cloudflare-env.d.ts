import type { R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    MODEL_R2_BUCKET?: R2Bucket;
  }
}

export {};
