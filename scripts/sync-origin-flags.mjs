import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN_FLAG_ISO = {
  ethiopia: "et",
  kenya: "ke",
  tanzania: "tz",
  rwanda: "rw",
  uganda: "ug",
  burundi: "bi",
  zambia: "zm",
  brazil: "br",
  colombia: "co",
  guatemala: "gt",
  "costa-rica": "cr",
  panama: "pa",
  honduras: "hn",
  peru: "pe",
  mexico: "mx",
  "el-salvador": "sv",
  jamaica: "jm",
  nicaragua: "ni",
  bolivia: "bo",
  indonesia: "id",
  vietnam: "vn",
  yemen: "ye",
  usa: "us",
  japan: "jp",
  "papua-new-guinea": "pg",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../packages/web/public/learn/flags");
fs.mkdirSync(outDir, { recursive: true });

for (const [slug, iso] of Object.entries(ORIGIN_FLAG_ISO)) {
  const url = `https://flagcdn.com/w320/${iso}.png`;
  const res = await fetch(url, { headers: { "User-Agent": "driplab-flag-sync/1.0" } });
  if (!res.ok) {
    console.error(`FAIL ${slug} (${iso}) HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = path.join(outDir, `${slug}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`OK ${slug} -> ${outPath} (${buf.length} bytes)`);
}
