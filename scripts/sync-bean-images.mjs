import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(repoRoot, "data", "images");
const destRoot = join(repoRoot, "packages", "web", "public", "beans");

function copyTree(src, dest) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      count += copyTree(srcPath, destPath);
    } else if (/\.(jpe?g|png|webp|gif)$/i.test(entry)) {
      cpSync(srcPath, destPath);
      count += 1;
    }
  }
  return count;
}

const copied = copyTree(srcRoot, destRoot);
console.log(`Synced ${copied} bean images -> packages/web/public/beans/`);
