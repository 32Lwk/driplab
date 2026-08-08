#!/usr/bin/env node
/**
 * Ogawa Coffee (小川珈琲) whole-bean scraper for DripLab.
 * Source: https://oc-shop.co.jp (Shopify)
 */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_PATH = path.join(ROOT, "data/scraped/ogawa/beans_raw.json");
const SEED_PATH = path.join(ROOT, "data/seeds/ogawa.beans.seed.json");
const NOTES_PATH = path.join(ROOT, "data/scraped/ogawa/scraping_notes.md");
const RATE_MS = 350;

const MVP_HANDLES = ["r-ocpremium-b", "932", "959"]; // premium blend, Ethiopia, Brazil

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "DripLab/0.1 (research)" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode >= 400) reject(new Error(`${url} HTTP ${res.statusCode}`));
          else resolve(data);
        });
      })
      .on("error", reject);
  });
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function stripHtml(html) {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWeightG(title) {
  const m = title.match(/(\d+)\s*[gｇ]/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseProductCode(title) {
  const m = title.match(/(?:No\.|R)(\d+)/i);
  if (m) return m[0].replace(/\s/g, "");
  const sku = title.match(/R\d+/);
  return sku ? sku[0] : null;
}

function parseDiamondScore(text, label) {
  const re = new RegExp(`${label}[：:]\\s*[◆●○]{1,5}`, "i");
  const m = text.match(re);
  if (!m) return null;
  const count = (m[0].match(/[◆●]/g) || []).length;
  return Math.round((count / 5) * 100) || null;
}

function parseTasteComment(html) {
  // Format A: <h3>味わいコメント</h3><p>...</p>
  let m = html.match(/味わいコメント[\s\S]*?<p>([\s\S]*?)<\/p>/i);
  if (m) {
    const block = stripHtml(m[1]);
    const first = block.split(/香り[：:]/)[0].trim();
    const cleaned = first.replace(/\.$/, "").trim();
    if (cleaned && !/^農園主|^■/.test(cleaned) && cleaned.length > 8) {
      return cleaned;
    }
  }
  // Format B: 【味わいコメント】 inline text (specialty / single origin pages)
  m = html.match(/【味わいコメント】\s*([\s\S]+?)(?:<p[^>]*>\s*<strong>香り|<strong>香り|香り[：:◆]|生豆生産国)/i);
  if (m) {
    return stripHtml(m[1]).replace(/\s+/g, " ").trim();
  }
  // Format C: plain text block before diamond ratings
  const text = stripHtml(html);
  m = text.match(/味わいコメント[】\s]*([^香]+?)(?:香り[：:]|苦味[：:])/);
  if (m) {
    const comment = m[1].trim();
    if (comment.length > 10 && !/^農園主/.test(comment)) return comment;
  }
  return null;
}

function parseOriginsFromBasic(html) {
  const m = html.match(/生豆生産国名[：:]([^）\n]+)/);
  if (!m) return null;
  return m[1]
    .split(/[、,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOriginsFromTitle(title) {
  const countries = [
    "エチオピア", "ブラジル", "コロンビア", "グアテマラ", "ケニア", "コスタリカ",
    "エルサルバドル", "インドネシア", "パナマ", "タンザニア", "メキシコ", "ニカラグア",
    "ブルンジ", "ジャマイカ", "イエメン", "ペルー", "ルワンダ", "ウガンダ", "ホンジュラス",
  ];
  const found = countries.filter((c) => title.includes(c));
  if (/ブレンド/.test(title) && !found.length) return ["ブレンド"];
  if (/モカ/.test(title) && !found.includes("エチオピア")) found.push("エチオピア（モカ）");
  if (found.length) return found;
  if (/ブレンド/.test(title)) return ["ブレンド"];
  return ["ブレンド"];
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function mapRoastLevel(title, bodyText, tags = []) {
  const tagList = normalizeTags(tags);
  const t = `${title} ${bodyText} ${tagList.join(" ")}`;
  if (/深煎|ダーク|ストロング|シティロースト|フレンチ/.test(t)) return { level: "dark", label: "深煎り" };
  if (/中深|ハイロースト/.test(t)) return { level: "medium_dark", label: "中深煎り" };
  if (/浅煎|ライト/.test(t)) return { level: "light", label: "浅煎り" };
  if (/中煎|ミディアム|マイルド/.test(t)) return { level: "medium", label: "中煎り" };
  return { level: "medium", label: "中煎り" };
}

function inferTasteLabel(title, tasteComment, bodyText) {
  const t = `${tasteComment || ""} ${bodyText} ${title}`;
  if (/すっきり|キレ|爽やか|シトラス/.test(t)) return "すっきり・キレ";
  if (/まろやか|やわらか|芳醇|なめらか/.test(t)) return "まろやか";
  if (/コク|深み|力強|ストロング/.test(t)) return "コク";
  if (/バランス|調和/.test(t)) return "バランス";
  if (/フルーティ|ベリー|果実|ワイン|グレープ|柑橘|レモン|オレンジ/.test(t)) return "フルーティ";
  if (/カフェインレス|デカフェ/.test(t)) return "カフェインレス";
  return "バランス";
}

function extractFlavorTags(title, tasteComment, bodyText) {
  const t = `${title} ${tasteComment || ""} ${bodyText}`;
  const tags = [];
  const keywords = [
    ["甘み", /甘|蜂蜜|キャラメル|チョコ|ベリー|フルーティ/],
    ["香ばしさ", /香ば|ナッツ|ロースト/],
    ["シトラス", /シトラス|レモン|オレンジ/],
    ["コク", /コク|ボディ|深み/],
    ["キレ", /キレ|すっきり/],
    ["花", /花|フローラル|ジャスミン/],
    ["スパイス", /スパイス|シナモン/],
    ["ナッツ", /ナッツ|アーモンド/],
    ["ベリー", /ベリー|ストロベリー|ブルーベリー/],
    ["モカ", /モカ/],
    ["オーガニック", /オーガニック|有機/],
    ["フェアトレード", /フェアトレード/],
  ];
  for (const [tag, re] of keywords) {
    if (re.test(t)) tags.push(tag);
  }
  return [...new Set(tags)].slice(0, 6);
}

function estimateScores(bodyText, roastLevel, title) {
  const aroma = parseDiamondScore(bodyText, "香り") ?? 50;
  const bitterness = parseDiamondScore(bodyText, "苦味") ?? (roastLevel === "dark" ? 70 : roastLevel === "light" ? 35 : 50);
  const acidity = parseDiamondScore(bodyText, "酸味") ?? (/ケニア|コスタリカ|エチオピア|モカ/.test(title) ? 65 : 45);
  const body = parseDiamondScore(bodyText, "コク") ?? (roastLevel === "dark" ? 70 : 50);

  let sweetness = 50;
  if (/甘|ベリー|モカ|フルーティ|やわらか|芳醇/.test(bodyText + title)) sweetness += 12;
  if (/ストロング|深煎|苦/.test(bodyText + title)) sweetness -= 8;
  if (/カフェインレス/.test(title)) sweetness += 5;
  sweetness = Math.max(25, Math.min(85, sweetness));

  return { acidity, body, bitterness, sweetness };
}

function caffeineLevel(title) {
  if (/カフェインレス|デカフェ/.test(title)) return "low";
  return "medium";
}

function slugify(name, weightG, handle) {
  const base = handle && !/^lab_|^\d+$/.test(handle) ? handle : null;
  if (base) {
    return weightG ? `ogawa-${base}-${weightG}g` : `ogawa-${base}`;
  }
  const num = name.match(/no\.\d+/i)?.[0]?.replace(".", "-");
  if (num) return weightG ? `ogawa-${num}-${weightG}g` : `ogawa-${num}`;
  const code = name.match(/(?:No\.|R)\d+/i)?.[0]?.toLowerCase();
  if (code) return weightG ? `ogawa-${code}-${weightG}g` : `ogawa-${code}`;
  return weightG ? `ogawa-bean-${weightG}g` : `ogawa-bean`;
}

function toSeedBean(b) {
  return {
    id: b.id,
    chain_id: b.chain_id,
    name: b.name,
    description: b.description,
    roast_level: b.roast_level,
    roast_label_ja: b.roast_label_ja,
    taste_label_ja: b.taste_label_ja,
    origin: b.origin,
    flavor_tags: b.flavor_tags,
    acidity: b.acidity,
    body: b.body,
    bitterness: b.bitterness,
    sweetness: b.sweetness,
    caffeine: b.caffeine,
    price_jpy: b.price_jpy,
    weight_g: b.weight_g,
    buy_url: b.buy_url,
    product_id: b.product_id,
    image_url: b.image_url,
    image_local: b.image_local,
    source: b.source,
    available: b.available,
    image_cdn_url: b.image_url ? `https://assets.coffee.yutok.dev/beans/ogawa/${b.product_id}.jpg` : null,
  };
}

function isWholeBeanProduct(title) {
  if (/（粉）|\(粉\)|ドリップコーヒー|【生豆】|生豆|リキッド|器具|マグ|サーバー|ドリッパー|ペーパー|ハンカチ|サブスク|Trial SET|アソート|カフェポッド|キューリグ|どら|スイーツ|セット.*粉|EC限定.*セット|手提げ|カードホルダー|Starter Set|WALLMUG|notNeutral|acaia|エアロプレス|カリタ/.test(title))
    return false;
  if (/（豆）|\(豆\)/.test(title)) return true;
  if (/ 豆 \d/.test(title)) return true;
  if (/^no\.\d+/.test(title) && /\d+g/.test(title)) return true;
  return false;
}

function isBundleOrSet(title) {
  return /【まとめ買い】|お試しセット|選べる|×\d+|セット|Trial SET|アソート/.test(title);
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const data = await fetchJson(`https://oc-shop.co.jp/products.json?limit=250&page=${page}`);
    if (!data.products?.length) break;
    all.push(...data.products);
    if (data.products.length < 250) break;
    await sleep(RATE_MS);
  }
  const seen = new Set();
  return all.filter((p) => {
    if (!isWholeBeanProduct(p.title)) return false;
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

async function enrichProduct(product) {
  const handle = product.handle;
  const detail = await fetchJson(`https://oc-shop.co.jp/products/${handle}.json`);
  const p = detail.product;
  await sleep(RATE_MS);

  let pageHtml = "";
  try {
    pageHtml = await fetchText(`https://oc-shop.co.jp/products/${handle}`);
    await sleep(RATE_MS);
  } catch {
    /* optional */
  }

  const bodyHtml = p.body_html || "";
  const bodyText = stripHtml(bodyHtml);
  const tasteComment = parseTasteComment(bodyHtml);
  const basicOrigins = parseOriginsFromBasic(pageHtml);
  const origins = basicOrigins?.length ? basicOrigins : parseOriginsFromTitle(p.title);
  const weightG = parseWeightG(p.title);
  const variant = p.variants?.[0] || {};
  const priceJpy = Math.round(parseFloat(variant.price || "0"));
  const productId = p.id;
  const sku = variant.sku || parseProductCode(p.title) || String(productId);
  const imageUrl = p.images?.[0]?.src || null;
  const tagList = normalizeTags(p.tags);
  const { level: roastLevel, label: roastLabelJa } = mapRoastLevel(p.title, bodyText, tagList);
  const tasteLabelJa = inferTasteLabel(p.title, tasteComment, bodyText);
  const flavorTags = extractFlavorTags(p.title, tasteComment, bodyText);
  const scores = estimateScores(bodyText, roastLevel, p.title);

  const descParts = [];
  if (tasteComment) descParts.push(tasteComment);
  const intro = bodyText.match(/1952年[\s\S]{0,200}/);
  if (intro && !tasteComment) descParts.push(intro[0].slice(0, 200));
  if (!descParts.length) descParts.push(bodyText.slice(0, 200));

  const basicInfo = pageHtml.match(/名称：[^<]+/)?.[0]?.replace(/<[^>]+>/g, " ") || "";
  if (basicInfo && basicInfo.includes("原材料") && !tasteComment) {
    descParts.push(stripHtml(basicInfo));
  }

  const description = stripHtml(descParts.join(" ")).slice(0, 500);

  return {
    id: slugify(p.title, weightG, handle),
    chain_id: "ogawa",
    name: p.title.replace(/　/g, " ").trim(),
    description,
    roast_level: roastLevel,
    roast_label_ja: roastLabelJa,
    taste_label_ja: tasteLabelJa,
    origin: origins,
    flavor_tags: flavorTags,
    acidity: scores.acidity,
    body: scores.body,
    bitterness: scores.bitterness,
    sweetness: scores.sweetness,
    caffeine: caffeineLevel(p.title),
    price_jpy: priceJpy,
    weight_g: weightG,
    buy_url: `https://oc-shop.co.jp/products/${handle}`,
    product_id: productId,
    product_code: sku,
    image_url: imageUrl,
    image_local: imageUrl ? `data/images/ogawa/${productId}.jpg` : null,
    source: "scraped",
    available: variant.available !== false,
    is_bundle: isBundleOrSet(p.title),
    tags: tagList,
    taste_comment: tasteComment,
    handle,
  };
}

async function main() {
  fs.mkdirSync(path.dirname(RAW_PATH), { recursive: true });

  console.error("Fetching product catalog...");
  const products = await fetchAllProducts();
  console.error(`Found ${products.length} whole-bean products`);

  const beans = [];
  const errors = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.error(`[${i + 1}/${products.length}] ${p.title}`);
    try {
      beans.push(await enrichProduct(p));
    } catch (e) {
      errors.push({ handle: p.handle, title: p.title, error: String(e) });
    }
  }

  beans.sort((a, b) => a.name.localeCompare(b.name, "ja"));

  const rawOutput = {
    scraped_at: new Date().toISOString().replace(/\.\d{3}Z$/, "+09:00"),
    source: "https://oc-shop.co.jp",
    chain_id: "ogawa",
    product_count: beans.length,
    errors,
    beans,
  };

  fs.writeFileSync(RAW_PATH, JSON.stringify(rawOutput, null, 2), "utf8");

  const mvpBeans = MVP_HANDLES.map((h) => beans.find((b) => b.handle === h)).filter(Boolean);

  const seedOutput = {
    version: "0.1.0",
    chain_id: "ogawa",
    scraped_at: rawOutput.scraped_at,
    source: rawOutput.source,
    beans: mvpBeans.map(toSeedBean),
  };

  fs.writeFileSync(SEED_PATH, JSON.stringify(seedOutput, null, 2), "utf8");

  const singles = beans.filter((b) => !b.is_bundle);
  const bundles = beans.filter((b) => b.is_bundle);

  const notes = `# Ogawa Coffee scraping notes

Scraped: ${rawOutput.scraped_at}
Source: ${rawOutput.source}

## Method
- Shopify public JSON API: \`/products.json\`, \`/products/{handle}.json\`
- Product pages fetched for 商品の基本情報 (origin countries from 原材料名)
- Taste scores estimated from 味わいコメント diamond ratings (◆) and description keywords

## Catalog scope
- **Included**: Products titled with \`（豆）\`, lab format \`豆 150g\`, or \`no.XX ... 100g\` (roasted whole bean)
- **Excluded**: 粉 (ground), ドリップ, 生豆 (green), equipment, gifts with ground coffee, subscriptions

## Counts
- Total whole-bean SKUs: **${beans.length}**
- Single-SKU products: **${singles.length}**
- Bundles / まとめ買い / sets: **${bundles.length}**

## Not available as whole bean on EC
- キリマンジャロブレンド — powder only (R043)
- カフェインレスブレンド — powder only (R040); organic decaf mocha available as bean (No.967)
- Seasonal 春/夏/秋/冬珈琲 — powder or drip only

## MVP seeds (${mvpBeans.length})
${mvpBeans.map((b) => `- ${b.name} (\`${b.handle}\`)`).join("\n")}

## Errors
${errors.length ? errors.map((e) => `- ${e.handle}: ${e.error}`).join("\n") : "None"}
`;

  fs.writeFileSync(NOTES_PATH, notes, "utf8");

  console.error(`Wrote ${RAW_PATH} (${beans.length} beans)`);
  console.error(`Wrote ${SEED_PATH} (${mvpBeans.length} MVP)`);
  console.error(`Wrote ${NOTES_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
