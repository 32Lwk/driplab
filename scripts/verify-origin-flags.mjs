import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const flagsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../packages/web/public/learn/flags",
);

const slugs = fs.readdirSync(flagsDir).filter((f) => f.endsWith(".png"));
let ok = 0;
for (const file of slugs) {
  const size = fs.statSync(path.join(flagsDir, file)).size;
  const pass = size > 500;
  console.log(`${pass ? "OK" : "NG"}\t${file}\t${size} bytes`);
  if (pass) ok++;
}
console.log(`\n${ok}/${slugs.length} flags`);
