import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { normalizeCatalog } = await import(
  pathToFileURL(join(root, "packages/recommender/src/index.ts")).href
);
const catalog = JSON.parse(
  readFileSync(join(root, "packages/web/src/data/beans.json"), "utf8"),
);
const beans = normalizeCatalog(catalog.beans).filter((b) => b.available !== false);

const maruyama = beans.filter((b) => b.chain_id === "maruyama");
const thin = maruyama.filter(
  (b) => !b.episode || b.episode.length < 50,
);
console.log("Maruyama:", maruyama.length, "thin episode (<50):", thin.length);

for (const b of maruyama.filter((x) => x.display_name.includes("アメリカン"))) {
  console.log("\n===", b.display_name, "===");
  console.log("episode:", b.episode);
  console.log("description:", b.description);
}

const swapped = maruyama.filter(
  (b) =>
    b.episode &&
    b.description &&
    b.episode.length < b.description.length * 0.6,
);
console.log("\nLikely swapped (episode much shorter):", swapped.length);
for (const b of swapped.slice(0, 8)) {
  console.log(b.display_name, "| ep:", b.episode?.length, "| desc:", b.description?.length);
}
