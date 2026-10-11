import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

//jsdelivr cdn
const mediaDir = join(process.cwd(), ".open-next", "assets", "_next", "static", "media");

let removed = 0;
try {
  for (const file of await readdir(mediaDir)) {
    if (file.endsWith(".wasm")) {
      await unlink(join(mediaDir, file));
      removed += 1;
    }
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log(`stripped ${removed} wasm asset(s) from .open-next/assets`);
