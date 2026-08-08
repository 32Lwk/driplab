import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "data/scraped/bluebottle/_coffee_products.json");
const OUT_RAW = path.join(ROOT, "data/scraped/bluebottle/beans_raw.json");
const OUT_SEED = path.join(ROOT, "data/seeds/bluebottle.beans.seed.json");

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRoast(text, name) {
  const m = text.match(/焙煎度合い[：:]\s*([^\s]+)/);
  if (m) return m[1];
  if (/深煎り|やや深/.test(text) || name.includes("東京喫茶") || name.includes("アウトドア"))
    return "ボールド";
  if (/ダークロースト/.test(text) || name.includes("ボールド")) return "ボールド";
  if (/ライトロースト/.test(text) || name.includes("ブライト")) return "バランス";
  if (/ディカフェ/.test(name)) return "ボールド";
  return null;
}

function extractFlavors(text) {
  const m = text.match(
    /フレーバー[：:]\s*([^原焙内賞保使]+?)(?:\s*ボディ|\s*焙煎|\s*原材料|\s*原産|$)/,
  );
  if (!m) return [];
  return m[1]
    .split(/[／\/、,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractOrigins(text) {
  const m1 = text.match(/原材料名[：:]\s*コーヒー豆[（(]([^）)]+)[）)]/);
  if (m1)
    return m1[1]
      .split(/[、,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  const m2 = text.match(/原産地域[：:]\s*([^プロ原]+?)(?:\s*プロセス|$)/);
  if (m2) return [m2[1].trim()];
  return [];
}

function extractBody(text) {
  const m = text.match(/ボディ[：:]\s*([^\s]+)/);
  return m ? m[1] : null;
}

function extractAcidity(text) {
  const m = text.match(/酸味[：:]\s*([^原プロ]+?)(?:\s*原産|\s*プロセス|$)/);
  return m ? m[1].trim() : null;
}

function extractProcess(text) {
  const m = text.match(/プロセス[：:]\s*([^\s]+)/);
  return m ? m[1] : null;
}

function extractDescription(text) {
  const idx = text.search(/フレーバー[：:]|原材料名[：:]/);
  const desc = idx > 0 ? text.slice(0, idx).trim() : text.slice(0, 400);
  return desc.replace(/＜注意事項＞.*$/, "").trim();
}

function mapRoastLevel(label) {
  if (!label) return "medium";
  if (label.includes("ボールド")) return "dark";
  if (label.includes("バランス") || label.includes("ブライト")) return "medium";
  if (label.includes("ライト")) return "light";
  return "medium";
}

function mapTasteLabel(name, roastLevel, flavors, bodyLabel, isDecaf) {
  if (isDecaf) return "カフェインレス";
  if (name.includes("東京喫茶")) return "深煎り・スモーキー";
  if (roastLevel === "dark") return "コク・ダーク";
  if (bodyLabel === "フル") return "複雑・ボディ感";
  if (flavors.some((f) => /ベリー|シトラス|レモン|グレープフルーツ|プラム/.test(f)))
    return "フルーティ";
  if (flavors.some((f) => /チョコ|ココア|キャラメル|ブラウン|マシュマロ/.test(f)))
    return "チョコレート系";
  return "バランス";
}

function scoreFromProfile(roastLevel, flavors, bodyLabel, acidityLabel, isDecaf) {
  const profiles = {
    light: { acidity: 62, body: 38, bitterness: 28, sweetness: 58 },
    medium: { acidity: 50, body: 50, bitterness: 45, sweetness: 55 },
    dark: { acidity: 38, body: 68, bitterness: 68, sweetness: 48 },
  };
  const base = profiles[roastLevel] ?? profiles.medium;

  let { acidity, body, bitterness, sweetness } = base;
  if (bodyLabel === "フル") body = Math.min(85, body + 15);
  if (bodyLabel === "ミディアム") body = Math.min(70, body + 5);
  if (/明るい/.test(acidityLabel ?? "")) acidity = Math.min(80, acidity + 12);
  if (/複雑/.test(acidityLabel ?? "")) acidity = Math.min(75, acidity + 8);
  if (flavors.some((f) => /ベリー|シトラス|レモン/.test(f)))
    acidity = Math.min(78, acidity + 10);
  if (flavors.some((f) => /チョコ|ココア|キャラメル/.test(f)))
    sweetness = Math.min(72, sweetness + 10);

  return {
    acidity,
    body,
    bitterness,
    sweetness,
    caffeine: isDecaf ? "low" : "medium",
  };
}

function slugId(handle, weightG) {
  const slugMap = {
    c001: "bella-donovan",
    c002: "giant-steps",
    c003: "three-africas",
    c004: "hayes-valley-espresso",
    c076: "night-light-decaf",
    c079: "bold-blend",
    c080: "bright-blend",
    c107: "human-made-future",
    c115: "human-made-past",
    c154: "outdoor-blend",
    c219484: "rwanda-nyamasheke",
    c225205: "tokyo-kissaten",
    c229156: "honduras-santa-barbara",
    c229670: "sumatra-kerinci",
  };
  const base = slugMap[handle] ?? handle;
  return `bluebottle-${base}-${weightG}g`;
}

function isSingleOrigin(tags, name) {
  return (
    tags.some((t) => t.includes("シングルオリジン")) ||
    /ウォッシュド|ナチュラル|ウェットハル/.test(name)
  );
}

function isBlend(tags, name) {
  return (
    tags.some((t) => t.includes("ブレンド")) ||
    /ブレンド|エスプレッソ|ドノヴァン|ステップス|アフリカズ|ディカフェ|喫茶|アウトドア|ヒューマンメイド/.test(
      name,
    )
  );
}

const beans = [];
const skipped = [];

for (const p of data.products) {
  if (p.product_type !== "コーヒー豆") {
    skipped.push({ handle: p.handle, name: p.title, reason: p.product_type });
    continue;
  }
  if (/セレクション/.test(p.title)) {
    skipped.push({ handle: p.handle, name: p.title, reason: "multi-pack set" });
    continue;
  }
  if (/挽き豆/.test(p.title)) {
    skipped.push({ handle: p.handle, name: p.title, reason: "pre-ground set" });
    continue;
  }

  const text = stripHtml(p.body_html);
  const roastLabel = extractRoast(text, p.title);
  const flavors = extractFlavors(text);
  const origins = extractOrigins(text);
  const bodyLabel = extractBody(text);
  const acidityLabel = extractAcidity(text);
  const process = extractProcess(text);
  const description = extractDescription(text);
  const isDecaf = p.tags.includes("ディカフェ") || /ディカフェ/.test(p.title);
  const coffeeType = isSingleOrigin(p.tags, p.title)
    ? "シングルオリジン"
    : isBlend(p.tags, p.title)
      ? "ブレンド"
      : null;
  const roastLevel = mapRoastLevel(roastLabel);
  const tasteLabel = mapTasteLabel(
    p.title,
    roastLevel,
    flavors,
    bodyLabel,
    isDecaf,
  );
  const originList =
    origins.length > 0
      ? origins
      : coffeeType === "ブレンド"
        ? ["ブレンド"]
        : [];

  const variantEntries = p.variants.filter((v) => v.title !== "Default Title");
  const targets = variantEntries.length ? variantEntries : p.variants;

  for (const v of targets) {
    const weightMatch =
      v.title.match(/(\d+)g/) || text.match(/内容量[：:]\s*(\d+)g/);
    const weight_g = weightMatch ? parseInt(weightMatch[1], 10) : 200;
    const price_jpy = Math.round(parseFloat(v.price));
    const handle = p.handle;
    const product_id =
      variantEntries.length > 1 ? `${handle}-${weight_g}g` : handle;
    const name =
      p.title + (variantEntries.length > 1 ? ` ${weight_g}g` : "");
    const scores = scoreFromProfile(
      roastLevel,
      flavors,
      bodyLabel,
      acidityLabel,
      isDecaf,
    );

    beans.push({
      id: slugId(handle, weight_g),
      product_id,
      shopify_product_id: p.id,
      shopify_variant_id: v.id,
      chain_id: "bluebottle",
      name,
      description,
      roast: roastLabel,
      roast_label_ja: roastLabel,
      roast_level: roastLevel,
      taste_label_ja: tasteLabel,
      body_label: bodyLabel,
      acidity_label: acidityLabel,
      processing: process,
      coffee_type: coffeeType,
      origin: originList,
      flavor_tags: flavors,
      ...scores,
      price_jpy,
      weight_g,
      buy_url: `https://store.bluebottlecoffee.jp/products/${handle}`,
      image_url: p.images[0]?.src ?? null,
      // Same hero image for all weight variants — keyed by Shopify handle, not variant id.
      image_local: `data/images/bluebottle/${handle}.jpg`,
      image_cdn_url: `https://assets.coffee.yutok.dev/beans/bluebottle/${handle}.jpg`,
      source: "scraped",
      available: v.available,
      tags: p.tags,
    });
  }
}

beans.sort((a, b) => a.name.localeCompare(b.name, "ja"));

const scrapedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "+09:00");

const raw = {
  version: "0.1.0",
  chain_id: "bluebottle",
  source: "https://store.bluebottlecoffee.jp",
  scraped_at: scrapedAt,
  count: beans.length,
  skipped,
  scraping_notes: [
    "Official EC: https://store.bluebottlecoffee.jp (Shopify). Corporate site bluebottlecoffee.jp links here for online bean sales.",
    "Catalog fetched via Shopify JSON API: /collections/coffee/products.json?limit=250 (29 products total in coffee collection).",
    "Whole-bean filter: product_type === 'コーヒー豆'. Excluded 11 instant-coffee SKUs and 4 multi-pack selection sets.",
    "All whole beans sold as whole bean only; store explicitly states no grinding service (挽き売りなし).",
    "Standard blends are 200g @ ¥1,950–2,550. Seasonal/single-origin offer 100g (¥1,484) and 200g (¥2,800) variants on same product page.",
    "Roast labels use Blue Bottle terminology: バランス (medium) and ボールド (dark). Some SKUs omit explicit roast label; inferred from description (e.g. 東京喫茶=深煎り, Bright/Bold from product name).",
    "Single-origin roster rotates seasonally; as of 2026-08-08: Sumatra Kerinci, Honduras Santa Bárbara, Rwanda Nyamasheke.",
    "アウトドアブレンド (c154) was SOLD OUT at scrape time.",
    "Product IDs are Shopify handles (e.g. c001); variant suffix added for multi-weight SO (-100g / -200g).",
  ],
  beans,
};

const mvpHandles = new Set(["c001", "c002", "c003"]);
const seedBeans = beans
  .filter((b) => mvpHandles.has(b.product_id.split("-")[0]))
  .filter((b) => b.weight_g === 200);

const seedFieldPick = ({
  id,
  chain_id,
  name,
  description,
  roast_level,
  roast_label_ja,
  taste_label_ja,
  origin,
  flavor_tags,
  acidity,
  body,
  bitterness,
  sweetness,
  caffeine,
  price_jpy,
  weight_g,
  buy_url,
  product_id,
  image_url,
  image_local,
  source,
  available,
  image_cdn_url,
}) => ({
  id,
  chain_id,
  name,
  description,
  roast_level,
  roast_label_ja,
  taste_label_ja,
  origin,
  flavor_tags,
  acidity,
  body,
  bitterness,
  sweetness,
  caffeine,
  price_jpy,
  weight_g,
  buy_url,
  product_id,
  image_url,
  image_local,
  source,
  available,
  image_cdn_url,
});

const seed = {
  version: "0.1.0",
  chain_id: "bluebottle",
  scraped_at: scrapedAt,
  source: "https://store.bluebottlecoffee.jp",
  beans: seedBeans.map(seedFieldPick),
};

fs.mkdirSync(path.dirname(OUT_RAW), { recursive: true });
fs.writeFileSync(OUT_RAW, JSON.stringify(raw, null, 2) + "\n", "utf8");
fs.writeFileSync(OUT_SEED, JSON.stringify(seed, null, 2) + "\n", "utf8");

console.log(`Wrote ${beans.length} beans to ${OUT_RAW}`);
console.log(`Wrote ${seedBeans.length} MVP seeds to ${OUT_SEED}`);

const ensure = spawnSync("py", ["-3", "-S", "scripts/ensure_bean_images.py", "--chain", "bluebottle"], {
  cwd: ROOT,
  stdio: "inherit",
});
if (ensure.status !== 0) {
  process.exit(ensure.status ?? 1);
}
