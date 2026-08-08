import type { BeanProduct, CaffeineLevel, ChainId, RoastLevel } from "./types";

type RawBean = Record<string, unknown>;

const ROAST_KEYWORDS: [RoastLevel, string[]][] = [
  ["light", ["light", "浅煎", "ブロンド", "ライト", "blond"]],
  ["medium", ["medium", "中煎", "ミディアム"]],
  ["medium_dark", ["medium_dark", "中深", "ハイロースト"]],
  ["dark", ["dark", "深煎", "ダーク", "フレンチ", "イタリアン"]],
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function inferRoast(raw: RawBean): RoastLevel {
  const existing = raw.roast_level as RoastLevel | undefined;
  if (existing && ROAST_KEYWORDS.some(([level]) => level === existing)) {
    return existing;
  }

  const haystack = [
    raw.roast,
    raw.roast_label_ja,
    raw.roast_level,
    raw.og_description,
    raw.content,
    raw.taste_label_ja,
    raw.taste_balance,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [level, keywords] of ROAST_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      return level;
    }
  }

  return "medium";
}

const ROAST_DEFAULTS: Record<
  RoastLevel,
  { acidity: number; body: number; bitterness: number; sweetness: number; caffeine: CaffeineLevel }
> = {
  light: { acidity: 65, body: 35, bitterness: 25, sweetness: 60, caffeine: "medium" },
  medium: { acidity: 50, body: 50, bitterness: 45, sweetness: 55, caffeine: "medium" },
  medium_dark: { acidity: 40, body: 65, bitterness: 60, sweetness: 45, caffeine: "medium" },
  dark: { acidity: 30, body: 70, bitterness: 75, sweetness: 35, caffeine: "medium" },
};

function num(val: unknown, fallback: number): number {
  return typeof val === "number" && !Number.isNaN(val) ? val : fallback;
}

function str(val: unknown): string | undefined {
  return typeof val === "string" && val.trim() ? val.trim() : undefined;
}

function strArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((v): v is string => typeof v === "string");
  }
  if (typeof val === "string" && val) {
    return [val];
  }
  return [];
}

export function normalizeBean(raw: RawBean): BeanProduct | null {
  const chain_id = str(raw.chain_id) as ChainId | undefined;
  const name = str(raw.name);
  const buy_url = str(raw.buy_url);

  if (!chain_id || !name || !buy_url) {
    return null;
  }

  const productId = raw.product_id ?? raw.product_code ?? slugify(name);
  const id = str(raw.id) ?? `${chain_id}-${String(productId)}`;

  const roast_level = inferRoast(raw);
  const defaults = ROAST_DEFAULTS[roast_level];

  const description =
    str(raw.description) ??
    str(raw.og_description)?.slice(0, 280) ??
    undefined;

  const originRaw = raw.origin;
  const origin = Array.isArray(originRaw)
    ? originRaw.filter((v): v is string => typeof v === "string")
    : str(originRaw)
      ? [originRaw as string]
      : [];

  const flavor_tags = strArray(raw.flavor_tags);
  if (flavor_tags.length === 0 && description) {
    const keywords = ["柑橘", "チョコ", "ナッツ", "ベリー", " floral", "甘み", "香ばし"];
    for (const k of keywords) {
      if (description.includes(k.trim())) flavor_tags.push(k.trim());
    }
  }

  const caffeineRaw = str(raw.caffeine);
  const caffeine: CaffeineLevel =
    caffeineRaw === "low" || caffeineRaw === "high" || caffeineRaw === "medium"
      ? caffeineRaw
      : defaults.caffeine;

  return {
    id,
    chain_id,
    name,
    description,
    roast_level,
    roast_label_ja: str(raw.roast_label_ja) ?? str(raw.roast as string),
    taste_label_ja: str(raw.taste_label_ja) ?? str(raw.taste_balance as string),
    origin: origin.length > 0 ? origin : undefined,
    flavor_tags: flavor_tags.length > 0 ? flavor_tags : undefined,
    acidity: num(raw.acidity, defaults.acidity),
    body: num(raw.body, defaults.body),
    bitterness: num(raw.bitterness, defaults.bitterness),
    sweetness: num(raw.sweetness, defaults.sweetness),
    caffeine,
    price_jpy: typeof raw.price_jpy === "number" ? raw.price_jpy : undefined,
    weight_g: typeof raw.weight_g === "number" ? raw.weight_g : undefined,
    buy_url,
    image_url: str(raw.image_url),
    image_local: str(raw.image_local),
    image_cdn_url: str(raw.image_cdn_url),
    available: raw.available !== false,
  };
}

export function normalizeCatalog(rawBeans: RawBean[]): BeanProduct[] {
  return rawBeans
    .map(normalizeBean)
    .filter((b): b is BeanProduct => b !== null);
}
