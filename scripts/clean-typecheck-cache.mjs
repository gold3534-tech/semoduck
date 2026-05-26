import { rmSync } from "node:fs";
import { join } from "node:path";

for (const target of [join(process.cwd(), ".next", "types"), join(process.cwd(), "tsconfig.tsbuildinfo")]) {
  rmSync(target, { recursive: true, force: true });
}
