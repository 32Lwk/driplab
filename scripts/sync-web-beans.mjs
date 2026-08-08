import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
copyFileSync(
  join(repoRoot, "data/catalog/beans.json"),
  join(repoRoot, "packages/web/src/data/beans.json"),
);
console.log("Synced beans.json -> packages/web/src/data/beans.json");
