import { rmSync } from "node:fs";
import { join } from "node:path";

const nextDir = join(process.cwd(), ".next");

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Cleaned .next cache for dev server.");
} catch (error) {
  console.warn("Could not clean .next cache. Stop the dev server and try again.");
  console.warn(error instanceof Error ? error.message : error);
}
